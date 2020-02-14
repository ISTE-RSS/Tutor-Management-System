import { NamedElement } from './Common';
import { Role } from './Role';
import { LoggedInUserTutorial, LoggedInUserSubstituteTutorial } from './Tutorial';

export interface LoggedInUser extends NamedElement {
  tutorials: LoggedInUserTutorial[];
  tutorialsToCorrect: LoggedInUserTutorial[];
  roles: User['roles'];
  hasTemporaryPassword: boolean;
  substituteTutorials: LoggedInUserSubstituteTutorial[];
}

export interface User extends NamedElement {
  readonly tutorials: string[];
  readonly tutorialsToCorrect: string[];
  readonly roles: Role[];
  readonly username: string;
  readonly email: string;
  readonly temporaryPassword?: string;
}

export interface UserDTO {
  firstname: User['firstname'];
  lastname: User['lastname'];
  tutorials: string[];
  tutorialsToCorrect: string[];
  roles: User['roles'];
  email: User['email'];
  username: User['username'];
}

export interface CreateUserDTO extends UserDTO {
  password: string;
}

export interface NewPasswordDTO {
  password: string;
}

export interface TutorInfo {
  lastname: string;
  firstname: string;
}