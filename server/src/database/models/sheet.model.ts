import { DocumentType, modelOptions, plugin, prop } from '@typegoose/typegoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { CollectionName } from '../../helpers/CollectionName';
import { SheetDTO } from '../../module/sheet/sheet.dto';
import { ISheet } from '../../shared/model/Sheet';
import { HasExercisesModel } from './ratedEntity.model';

@plugin(mongooseAutoPopulate)
@modelOptions({ schemaOptions: { collection: CollectionName.SHEET } })
export class SheetModel extends HasExercisesModel {
  static fromDTO(dto: SheetDTO): SheetModel {
    const model = new SheetModel();
    SheetModel.assignDTO(model, dto);

    return model;
  }

  protected static assignDTO(model: SheetModel, dto: SheetDTO): SheetModel {
    HasExercisesModel.assignDTO(model, dto);

    model.sheetNo = dto.sheetNo;
    model.bonusSheet = dto.bonusSheet;

    return model;
  }

  @prop({ required: true })
  sheetNo!: number;

  @prop({ required: true })
  bonusSheet!: boolean;

  get sheetNoAsString(): string {
    return this.sheetNo.toString(10).padStart(2, '0');
  }

  updateFromDTO(this: SheetDocument, dto: SheetDTO): SheetDocument {
    SheetModel.assignDTO(this, dto);

    return this;
  }

  toDTO(this: SheetDocument): ISheet {
    return {
      id: this.id,
      sheetNo: this.sheetNo,
      bonusSheet: this.bonusSheet,
      exercises: this.exercises.map((ex) => ex.toDTO()),
    };
  }
}

export type SheetDocument = DocumentType<SheetModel>;
