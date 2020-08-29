export type AuthorType = 'guest' | 'member' | 'moderator' | 'owner'
export type Types = { [authorType in AuthorType]: boolean }

export type Settings = {
  types: Types
}
