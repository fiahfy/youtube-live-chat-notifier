export type Settings = {
  types: { [authorType in 'guest' | 'member' | 'moderator' | 'owner']: boolean }
}
