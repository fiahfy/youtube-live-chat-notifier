export type AuthorType = 'guest' | 'member' | 'moderator' | 'owner'

export default interface Settings {
  enabledTypes: AuthorType[]
}
