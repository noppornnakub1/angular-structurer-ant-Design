import { Injectable } from '@angular/core';
import { HttpClient , HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { prefix } from '../../modules/supplier/pages/supplier-add/supplier-add.component';
import { MasterContent } from '../../modules/dashboard/services/MasterContent.interface';
import { AnnouncementConsent } from '../../modules/dashboard/services/AnnouncementConsent.interface';


@Injectable({
    providedIn: 'root'
})
export class MasterContentService {
    private apiUrl = '/MasterContent/GetContentById';

    constructor(private _http: HttpClient) { }

    findContentById(id: number): Observable<MasterContent> {
        return this._http.get<MasterContent>(`/MasterContent/GetContentById?id=${id}`);
    }

    GetAnnouncementByUsername(username: string): Observable<AnnouncementConsent> {
        return this._http.get<AnnouncementConsent>(`/MasterContent/GetAnnouncementByUsername?username=${username}`);
    }

    addAnnouncement(username: string): Observable<any> {
        const url = `/MasterContent/InsertAnnouncement`;
        const params = new HttpParams().set('username', username);
        return this._http.post(url, null, { params });
    }
}