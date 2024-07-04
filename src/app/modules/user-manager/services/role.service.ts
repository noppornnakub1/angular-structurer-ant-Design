import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { IRole } from "../interface/role.interface";

@Injectable({
    providedIn: 'root'
  })
  export class RoleService {
    private rolesUrl = '/assets/data/roles.json';  // Path to the JSON file
  
    constructor(private http: HttpClient) { }
  
    getRoles(): Observable<IRole[]> {
      return this.http.get<IRole[]>(this.rolesUrl);
    }
  }