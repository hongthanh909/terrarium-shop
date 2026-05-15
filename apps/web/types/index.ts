// Next.js Core
import type { NextPage } from 'next';
import type { GetStaticProps, GetServerSideProps } from 'next';

export { NextPage, GetStaticProps, GetServerSideProps };

// Types for the application
export type Optional<T> = T | null;
export type Maybe<T> = T | undefined;
export type AsyncResult<T> = Promise<Result<T>>;

export interface Result<T, E = Error> {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};