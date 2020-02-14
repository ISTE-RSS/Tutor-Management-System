declare module 'mongoose-field-encryption' {
  function fieldEncryption(schema: any, options: any): void;

  export interface EncryptionFunctionsOnDocument {
    encryptFieldsSync(): void;
    decryptFieldsSync(): void;
    stripEncryptionFieldMarkers(): void;
  }

  export type EncryptedDocument<T> = T & EncryptionFunctionsOnDocument;
}
