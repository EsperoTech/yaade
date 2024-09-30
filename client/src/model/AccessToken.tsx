interface AccessToken {
  id: number;
  ownerId: number;
  data: AccessTokenData;
  secret?: string;
}

interface AccessTokenData {
  name?: string;
  createdAt?: number;
}

export default AccessToken;
