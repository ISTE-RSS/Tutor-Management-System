import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { ScheinexamModel } from '../../database/models/scheinexam.model';
import { CrudService } from '../../helpers/CRUDService_new';

@Injectable()
export class ScheinexamService extends CrudService<typeof ScheinexamModel> {
  constructor(
    @InjectModel(ScheinexamModel)
    private readonly scheinexamModel: ReturnModelType<typeof ScheinexamModel>
  ) {
    super(scheinexamModel);
  }
}
