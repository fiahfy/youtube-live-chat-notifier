export type AuthorType = 'guest' | 'member' | 'moderator' | 'owner'
export type Types = { [authorType in AuthorType]: boolean }

export default interface Settings {
  types: Types
}
