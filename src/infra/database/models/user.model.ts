import { HydratedDocument, Model, Schema, model } from 'mongoose';

export interface UserAttrs {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export type UserDocument = HydratedDocument<UserAttrs>;

const userSchema = new Schema<UserAttrs>(
  {
    name: { type: String, required: true, trim: true },
    // Unique index: e-mail is the login key, looked up on every register/login.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);

export const UserModel: Model<UserAttrs> = model<UserAttrs>('User', userSchema);
