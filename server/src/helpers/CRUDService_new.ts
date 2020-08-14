import { NotFoundException } from '@nestjs/common';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { CreateQuery } from 'mongoose';

interface CrudModelConstructor {
  new (...args: unknown[]): CrudModel;

  fromDTO(dto: CrudDTO): CrudModel;
}

export type CrudDTO = unknown;
export type CrudResponse = {};
export type CrudDocument<MOD extends CrudModelConstructor> = DocumentType<InstanceType<MOD>>;

export abstract class CrudModel {
  abstract updateFromDTO(this: DocumentType<CrudModel>, dto: CrudDTO): DocumentType<CrudModel>;

  abstract toDTO(): CrudResponse;
}

export class CrudService<MOD extends CrudModelConstructor> {
  constructor(private readonly model: ReturnModelType<MOD>) {}

  /**
   * @returns All documents of this model saved in the database.
   */
  async findAll(): Promise<CrudDocument<MOD>[]> {
    const documents = await this.model.find().exec();

    return documents;
  }

  /**
   * Searches for a document with the given ID and returns it.
   *
   * @param id ID to search for.
   *
   * @returns CrudDocument<MOD> with the given ID.
   *
   * @throws `NotFoundException` - If no document with the given ID could be found.
   */
  async findById(id: string): Promise<CrudDocument<MOD>> {
    const doc = await this.model.findById(id).exec();

    if (!doc) {
      throw new NotFoundException(
        `Document with the ID ${id} oculd not be found. Model: ${this.model.name}`
      );
    }

    return doc;
  }

  /**
   * Creates a document with the given information. Returns the created document.
   *
   * @param dto Information to create the document with.
   *
   * @returns Created document.
   */
  async create(dto: CrudDTO): Promise<CrudDocument<MOD>> {
    const doc = this.model.fromDTO(dto);
    const created = await this.model.create(doc as CreateQuery<CrudDocument<MOD>>);

    return created;
  }

  /**
   * Updates the document with the given ID with the given information.
   *
   * Afterwards it is saved to the database and the updated version is returned.
   *
   * @param id ID of the document to update.
   * @param dto Information to update the document with.
   *
   * @returns Update document.
   *
   * @throws `NotFoundException` - If no document with the given ID could be found.
   */
  async update(id: string, dto: CrudDTO): Promise<CrudDocument<MOD>> {
    const doc = await this.findById(id);
    const updated = await doc.updateFromDTO(dto).save();

    return updated as CrudDocument<MOD>;
  }

  /**
   * Deletes the document with the given ID.
   *
   * @param id ID of the document to delete.
   *
   * @returns The deleted CrudDocument<MOD>.
   *
   * @throws `NotFoundException` - If no document with the given ID could be found.
   */
  async delete(id: string): Promise<CrudDocument<MOD>> {
    const document = await this.findById(id);

    return document.remove() as Promise<CrudDocument<MOD>>;
  }
}
