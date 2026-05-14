export type BuiltinAccount = {
  readonly id: string;
  readonly email: string;
  readonly password: string;
};

export const BUILTIN_ACCOUNTS: readonly BuiltinAccount[] = [
  {
    id: 'default_user_maniblesk',
    email: 'maniblesk@gmail.com',
    password: 'apfl21SME',
  },
  {
    id: 'default_user_english',
    email: 'english',
    password: 'english',
  },
];
