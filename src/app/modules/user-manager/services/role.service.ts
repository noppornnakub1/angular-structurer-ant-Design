import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { IRole } from "../interface/role.interface";

@Injectable({
    providedIn: 'root'
  })
  export class RoleService {
    private rolesUrl = '/assets/data/roles.json';  // Path to the JSON file
  
    constructor(private _http: HttpClient) { }
  
    // getRoles(): Observable<IRole[]> {
    //   return this.http.get<IRole[]>(this.rolesUrl);
    // }

    // getRoles() {
    //   return this._http.get(`/Role/RoleList`);
    // }
    getRoles(): Observable<IRole[]> {
      return this._http.get<IRole[]>('/Role/RoleList');
    }

  }