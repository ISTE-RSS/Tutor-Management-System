import { ValidationErrorsWrapper } from 'shared/dist/model/errors/Errors';
import {
  FormBooleanFieldData,
  FormDataResponse,
  FormDataSet,
  FormEnumFieldData,
  FormFieldData,
  FormFloatFieldData,
  FormIntegerFieldData,
  FormSelectValue,
  FormStringFieldData,
} from 'shared/dist/model/FormTypes';
import {
  CriteriaInformation,
  ScheinCriteriaDTO,
  ScheinCriteriaResponse,
  ScheinCriteriaStatus,
  ScheinCriteriaSummary,
  ScheincriteriaSummaryByStudents,
  SingleScheincriteriaSummaryByStudents,
} from 'shared/dist/model/ScheinCriteria';
import { validateSchema } from 'shared/dist/validators/helper';
import * as Yup from 'yup';
import Logger from '../../helpers/Logger';
import { TypegooseDocument } from '../../helpers/typings';
import ScheincriteriaModel, {
  ScheincriteriaDocument,
  ScheincriteriaSchema,
} from '../../model/documents/ScheincriteriaDocument';
import { StudentDocument } from '../../model/documents/StudentDocument';
import { BadRequestError, DocumentNotFoundError } from '../../model/Errors';
import { Scheincriteria, ScheincriteriaYupSchema } from '../../model/scheincriteria/Scheincriteria';
import { ScheincriteriaForm } from '../../model/scheincriteria/ScheincriteriaForm';
import {
  ScheincriteriaMetadata,
  ScheincriteriaMetadataKey,
} from '../../model/scheincriteria/ScheincriteriaMetadata';
import studentService from '../student-service/StudentService.class';
import tutorialService from '../tutorial-service/TutorialService.class';
import scheinexamService from '../scheinexam-service/ScheinexamService.class';
import sheetService from '../sheet-service/SheetService.class';
import { SheetDocument } from '../../model/documents/SheetDocument';
import { ScheinexamDocument } from '../../model/documents/ScheinexamDocument';

interface ScheincriteriaWithId {
  criteriaId: string;
  criteriaName: string;
  criteria: Scheincriteria;
}

interface SingleCriteriaResultOfAllStudentsParams {
  criteriaDoc: ScheincriteriaDocument;
  students: StudentDocument[];
  sheets: SheetDocument[];
  exams: ScheinexamDocument[];
}

interface CalculateCriteriaResultOfStudentParams {
  student: StudentDocument;
  sheets: SheetDocument[];
  exams: ScheinexamDocument[];
  criterias: ScheincriteriaWithId[];
}

export class ScheincriteriaService {
  private criteriaMetadata: Map<string, ScheincriteriaMetadata>;
  private criteriaBluePrints: Map<string, ScheincriteriaForm>;
  private criteriaSchemas: Map<string, ScheincriteriaYupSchema>;

  constructor() {
    this.criteriaBluePrints = new Map();
    this.criteriaMetadata = new Map();
    this.criteriaSchemas = new Map();
  }

  public async getAllCriterias(): Promise<ScheinCriteriaResponse[]> {
    const criterias = await ScheincriteriaModel.find();

    return Promise.all(criterias.map(doc => this.getScheincriteriaOrReject(doc)));
  }

  private async getDocumentWithId(id: string): Promise<ScheincriteriaDocument> {
    const criteria: ScheincriteriaDocument | null = await ScheincriteriaModel.findById(id);

    if (!criteria) {
      return this.rejectScheincriteriaNotFound();
    }

    return criteria;
  }

  public async createCriteria(criteriaDTO: ScheinCriteriaDTO): Promise<ScheinCriteriaResponse> {
    const scheincriteria: Scheincriteria = this.generateCriteriaFromDTO(criteriaDTO);
    const documentData: TypegooseDocument<ScheincriteriaSchema> = {
      name: criteriaDTO.name,
      criteria: scheincriteria,
    };
    const criteriaDocument = await ScheincriteriaModel.create(documentData);

    return this.getScheincriteriaOrReject(criteriaDocument);
  }

  public async updateCriteria(
    id: string,
    criteriaDTO: ScheinCriteriaDTO
  ): Promise<ScheinCriteriaResponse> {
    const criteriaDoc = await this.getDocumentWithId(id);
    const updatedCriteria = this.generateCriteriaFromDTO(criteriaDTO);

    criteriaDoc.name = criteriaDTO.name;
    criteriaDoc.criteria = updatedCriteria;

    return this.getScheincriteriaOrReject(await criteriaDoc.save());
  }

  public async deleteCriteria(id: string): Promise<ScheinCriteriaResponse> {
    const criteria = await this.getDocumentWithId(id);

    return this.getScheincriteriaOrReject(await criteria.remove());
  }

  public async getCriteriaInformation(id: string): Promise<CriteriaInformation> {
    const [criteriaDoc, students, sheets, exams] = await Promise.all([
      this.getDocumentWithId(id),
      studentService.getAllStudentsAsDocuments(),
      sheetService.getAllSheetsAsDocuments(),
      scheinexamService.getAllScheinExamAsDocuments(),
    ]);

    const criteria = this.generateCriteriaFromDocument(criteriaDoc);

    const [criteriaInfo, studentSummaries] = await Promise.all([
      criteria.getInformation(students),
      this.getSingleCriteriaResultOfAllStudents({
        criteriaDoc,
        students,
        sheets,
        exams,
      }),
    ]);

    return {
      name: criteriaDoc.name,
      studentSummaries,
      ...criteriaInfo,
    };
  }

  public getSingleCriteriaResultOfAllStudents({
    criteriaDoc,
    students,
    sheets,
    exams,
  }: SingleCriteriaResultOfAllStudentsParams): SingleScheincriteriaSummaryByStudents {
    const criteria = this.generateCriteriaFromDocument(criteriaDoc);
    const results: ScheinCriteriaStatus[] = [];
    const studentSummaries: SingleScheincriteriaSummaryByStudents = {};

    for (const student of students) {
      const status = criteria.checkCriteriaStatus({ student, sheets, exams });

      results.push({ id: criteriaDoc.id, name: criteriaDoc.name, ...status });
    }

    results.forEach((status, idx) => {
      const student = students[idx];
      studentSummaries[student.id] = status;
    });

    return studentSummaries;
  }

  public async getCriteriaResultsOfAllStudents(): Promise<ScheincriteriaSummaryByStudents> {
    return this.calculateCriteriaResultOfMultipleStudents(
      await studentService.getAllStudentsAsDocuments()
    );
  }

  public async getCriteriaResultOfStudent(studentId: string): Promise<ScheinCriteriaSummary> {
    const [student, criterias, sheets, exams] = await Promise.all([
      studentService.getDocumentWithId(studentId),
      this.getAllCriteriaObjects(),
      sheetService.getAllSheetsAsDocuments(),
      scheinexamService.getAllScheinExamAsDocuments(),
    ]);

    return this.calculateCriteriaResultOfStudent({ student, criterias, sheets, exams });
  }

  public async getCriteriaResultsOfStudentsOfTutorial(
    tutorialId: string
  ): Promise<ScheincriteriaSummaryByStudents> {
    const students: StudentDocument[] = await tutorialService.getStudentsOfTutorialAsDocuments(
      tutorialId
    );

    return this.calculateCriteriaResultOfMultipleStudents(students);
  }

  private async calculateCriteriaResultOfMultipleStudents(
    students: StudentDocument[]
  ): Promise<ScheincriteriaSummaryByStudents> {
    const summaries: ScheincriteriaSummaryByStudents = {};
    const [criterias, sheets, exams] = await Promise.all([
      this.getAllCriteriaObjects(),
      sheetService.getAllSheetsAsDocuments(),
      scheinexamService.getAllScheinExamAsDocuments(),
    ]);

    const summariesByStudent = students.map(student => {
      const result = this.calculateCriteriaResultOfStudent({
        student,
        criterias,
        sheets,
        exams,
      });

      return {
        id: student.id,
        result,
      };
    });

    for (const summary of summariesByStudent) {
      summaries[summary.id] = summary.result;
    }

    return summaries;
  }

  private calculateCriteriaResultOfStudent({
    student,
    criterias,
    sheets,
    exams,
  }: CalculateCriteriaResultOfStudentParams): ScheinCriteriaSummary {
    const criteriaSummaries: ScheinCriteriaSummary['scheinCriteriaSummary'] = {};
    let isPassed: boolean = true;

    for (const { criteriaId, criteriaName, criteria } of criterias) {
      const result = criteria.checkCriteriaStatus({ student, sheets, exams });

      criteriaSummaries[criteriaId] = { id: criteriaId, name: criteriaName, ...result };

      if (!result.passed) {
        isPassed = false;
      }
    }

    return {
      passed: isPassed,
      scheinCriteriaSummary: criteriaSummaries,
    };
  }

  private async getAllCriteriaObjects(): Promise<ScheincriteriaWithId[]> {
    const criterias = await ScheincriteriaModel.find();

    return Promise.all(
      criterias.map(doc => ({
        criteriaId: doc.id,
        criteriaName: doc.name,
        criteria: this.generateCriteriaFromDocument(doc),
      }))
    );
  }

  private generateCriteriaFromDocument({ name, criteria }: ScheincriteriaDocument): Scheincriteria {
    const { identifier, ...data } = criteria;

    return this.generateCriteriaFromDTO({ identifier: criteria.identifier, data, name });
  }

  private generateCriteriaFromDTO({ identifier, data }: ScheinCriteriaDTO): Scheincriteria {
    const bluePrintData = this.criteriaBluePrints.get(identifier);

    if (!bluePrintData) {
      throw new Error(`No criteria found for identifier '${identifier}'.`);
    }

    // Get the constructor of the blueprint. The type needs to be set here because 'constructor' is only typed as 'Function' and therefore cannot be used with 'new' in front of it.
    const prototype = bluePrintData.blueprint.constructor as new () => Scheincriteria;
    const criteria: Scheincriteria = Object.assign(new prototype(), data);

    return criteria;
  }

  private async getScheincriteriaOrReject({
    id,
    name,
    criteria,
  }: ScheincriteriaDocument): Promise<ScheinCriteriaResponse> {
    const response: ScheinCriteriaResponse = {
      id,
      identifier: criteria.identifier,
      name,
    };

    for (const key in criteria) {
      response[key] = (criteria as any)[key];
    }

    return response;
  }

  public async getFormData(): Promise<FormDataResponse> {
    const formData: FormDataResponse = {};

    this.criteriaBluePrints.forEach((form, key) => {
      const formDataSet: FormDataSet = {};
      form.formDataSet.forEach((data, dataKey) => {
        formDataSet[dataKey] = data;
      });

      formData[key] = formDataSet;
    });

    return formData;
  }

  public validateDataOfScheincriteriaDTO(
    obj: ScheinCriteriaDTO
  ): Yup.Shape<object, any> | ValidationErrorsWrapper {
    const schema = this.criteriaSchemas.get(obj.identifier);

    if (!schema) {
      throw new BadRequestError(
        `There is no schema registered for the given schein criteria identifier '${obj.identifier}`
      );
    }

    return validateSchema(schema, obj.data);
  }

  public registerBluePrint(criteria: Scheincriteria, validationSchema: ScheincriteriaYupSchema) {
    Logger.info(`Scheincriteria identifier: ${criteria.identifier}`);

    const criteriaForm = new ScheincriteriaForm(criteria);

    for (const [propertyName, propertyDescriptor] of Object.entries(
      Object.getOwnPropertyDescriptors(criteria)
    )) {
      const fieldData = this.getFormFieldDataForProperty(
        propertyName,
        propertyDescriptor,
        criteria
      );

      if (fieldData) {
        criteriaForm.formDataSet.set(propertyName, fieldData);
        Logger.info(`\t${fieldData.type} field '${propertyName}' added.`);
      }
    }

    this.criteriaBluePrints.set(criteria.identifier, criteriaForm);
    this.criteriaSchemas.set(criteria.identifier, validationSchema);

    Logger.info(`\tCriteria blue print with identifier '${criteria.identifier}' registered.`);
  }

  public unregisterBluePrint(criteria: Scheincriteria) {
    this.criteriaBluePrints.delete(criteria.identifier);
  }

  public addMetadata(key: ScheincriteriaMetadataKey, value: ScheincriteriaMetadata) {
    this.criteriaMetadata.set(this.getKeyAsString(key), value);
  }

  private getMetadata(target: Record<string, any>, propertyName: string): ScheincriteriaMetadata {
    let currentClass = target;

    while (!!currentClass) {
      const metadata = this.criteriaMetadata.get(
        this.getKeyAsString({
          className: currentClass.name || currentClass.constructor.name,
          propertyName,
        })
      );

      if (metadata) {
        return metadata;
      }

      currentClass = Object.getPrototypeOf(currentClass);
    }

    return { type: 'empty' };
  }

  private getFormFieldDataForProperty(
    propertyName: string,
    propertyDescriptor: PropertyDescriptor,
    criteria: Scheincriteria
  ): FormFieldData | undefined {
    if (propertyName === 'identifier') {
      return undefined;
    }

    const type = typeof propertyDescriptor.value;
    const metadata: ScheincriteriaMetadata = this.getMetadata(criteria, propertyName);

    if (metadata.type === 'ignore') {
      return undefined;
    }

    if (metadata.type === 'enum') {
      const enumValues = metadata.enumEntries.map(entry => new FormSelectValue(entry, entry));

      return new FormEnumFieldData(enumValues);
    }

    let fieldData: FormFieldData | undefined;

    switch (type) {
      case 'string':
        fieldData = new FormStringFieldData();
        break;

      case 'boolean':
        fieldData = new FormBooleanFieldData();
        break;

      case 'number':
      case 'bigint':
        if (metadata.type === 'empty') {
          throw new Error(
            `${propertyName} is a number. Number properties should have metadata to provide additional information. Please use @ScheincriteriaNumber() at the property ${propertyName}.`
          );
        }

        switch (metadata.type) {
          case 'int':
            fieldData = new FormIntegerFieldData({ min: metadata.min, max: metadata.max });
            break;

          case 'percentage':
            fieldData = new FormFloatFieldData({
              min: 0,
              max: 100,
              percentage: true,
              percentageToggleField: undefined,
            });
            break;

          case 'possible-percentage':
            fieldData = new FormFloatFieldData({ percentageToggleField: metadata.toggledBy });
            break;

          case 'float':
            fieldData = new FormFloatFieldData({ min: metadata.min, max: metadata.max });
            break;

          default:
            fieldData = new FormFloatFieldData({});
        }
        break;

      default:
        Logger.warn(
          `Property '${propertyName}' with type '${type}' is not supported by the scheincriteria form systems.`
        );
    }

    return fieldData;
  }

  private getKeyAsString(key: ScheincriteriaMetadataKey): string {
    return `${key.className}::${key.propertyName}`;
  }

  private async rejectScheincriteriaNotFound(): Promise<any> {
    return Promise.reject(new DocumentNotFoundError('Scheincriteria with that ID was not found.'));
  }
}

const scheincriteriaService = new ScheincriteriaService();
export default scheincriteriaService;