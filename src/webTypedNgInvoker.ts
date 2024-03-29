﻿import { HttpClient, HttpParams } from '@angular/common/http';
import { Optional, Inject, Injectable } from '@angular/core';
import { WebTypedEventEmitterService } from './webTypedEventEmitter.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebTypedCallInfo, WebTypedUtils, WebTypedInvoker } from '@guimabdo/webtyped-common';
@Injectable()
export class WebTypedNgInvoker extends WebTypedInvoker {

    constructor(
		@Optional() @Inject('API_BASE_URL') private baseUrl: string,
		private httpClient: HttpClient,
		private eventEmitter: WebTypedEventEmitterService
	) {
		super();
	 }

	private generateHttpParams(obj: any): HttpParams {
		var params = WebTypedUtils.resolveQueryParameters(obj);
		var httpParams = new HttpParams();
		params.forEach(r => httpParams = httpParams.set(r.path, r.val));
		return httpParams;
	}
	
	public invoke<TParameters, TResult>(
		info: WebTypedCallInfo<TParameters, TResult>, 
		api: string,
		action: string,
		httpMethod: string, 
		body?: any, 
		search?: any,
		expects?: any
		): Observable<TResult> | Promise<TResult> {
		let httpClient = this.httpClient;
		let url = WebTypedUtils.resolveActionUrl(this.baseUrl, api, action);
	
		//Creating options
        let options: any = {};

		if (search) {
			options.params = this.generateHttpParams(search);
        }

		//If body is string, force to send it as JSON
        if (body && typeof (body) === 'string') {
            options.headers = { 'Content-Type': 'application/json' };
            body = JSON.stringify(body);
		}
		
		//If return type is string, tell angular to not parse it to JSON
		if(info.returnTypeName === 'string'){
			options.responseType = 'text';
		}

		var httpObservable: Observable<any>;
		switch (httpMethod) {
			case 'get':
                httpObservable = httpClient.get<TResult>(url, options);
				break;
			case 'put':
				httpObservable = httpClient.put<TResult>(url, body, options);
				break;
			case 'patch':
				httpObservable = httpClient.patch<TResult>(url, body, options);
				break;
			case 'delete':
				httpObservable = httpClient.delete<TResult>(url, options);
				break;
			case 'post':
			default:
				httpObservable = httpClient.post<TResult>(url, body, options);
				break;
		}

		var coreObs = httpObservable //Emit completed event
			.pipe(
				tap(data => {
					info.result = data;
					this.eventEmitter.emit(info);
				},
					r => {

					})
			);

		//Expected return type
		if(expects){
			//Native promise
			if(expects.name == 'Promise' && !expects.module){
				return coreObs.toPromise();
			}
		}
		
		//Defaults to observable
		return coreObs;
	}

	/*
	public withPromises(): WebTypedInvoker {
        let me = this;
        return <any>{
            invoke: function () {
                return me.invoke.apply(me, [...arguments]).toPromise();
            }
        }
	}
	*/
}
