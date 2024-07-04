import { IUser } from "../interface/user.interface";

export class User implements IUser {
    public id: number;
    public name: string;
    public email: string;
    public age: number; 

    constructor({ id, name, email, age }: IUser) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.age = age;
    }

    getDisplayName(): string {
        return `${this.name} (${this.email})`;
    }

    isValidEmail(): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.email);
    }
}