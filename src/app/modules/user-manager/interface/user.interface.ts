 export interface IUser {
    user:{
        userId: number;
        firstname: string;
        lastname: string;
        email: string;
        role: number;
        status: number;
        CreateDate: string;
        UpdateDate: string;
        username: string;
        password: string;
        company:string;
        EmpNo:string;
    },
    jwtToken: string;
  }