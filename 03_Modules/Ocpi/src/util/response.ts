import { HttpStatus } from './http.status';

export class Response<T> {
  code: HttpStatus = HttpStatus.OK;
  data: T;

  constructor(data: T);
  constructor(data: T, code = HttpStatus.OK) {
    this.data = data;
    this.code = code;
  }
}
