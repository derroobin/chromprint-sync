/* tslint:disable */
/* eslint-disable */
/**
*/
export class ChromaprintContext {
  free(): void;
/**
*/
  constructor();
/**
* @param {Int16Array} data
*/
  feed(data: Int16Array): void;
/**
* @returns {string}
*/
  finish(): string;
/**
* @returns {Uint32Array}
*/
  finish_raw(): Uint32Array;
}
