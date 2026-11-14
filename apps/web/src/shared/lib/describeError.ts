import { ApiRequestError } from '../api/httpClient';

const TITLE_BY_CODE: Record<string, string> = {
  VALIDATION_ERROR: 'Alguns campos não estão válidos.',
  NOT_FOUND: 'O registro não foi encontrado. Ele pode ter sido removido.',
  CONFLICT: 'Já existe um registro com esses dados.',
  BUSINESS_RULE_VIOLATION: 'A operação não é permitida.',
  INTERNAL_ERROR: 'Erro inesperado no servidor. Tente novamente.',
};

export interface ErrorDescription {
  title: string;
  detail?: string;
}

export function describeError(error: unknown): ErrorDescription {
  if (error instanceof ApiRequestError) {
    return {
      title: TITLE_BY_CODE[error.code] ?? 'Não foi possível concluir a operação.',
      detail: error.message,
    };
  }
  if (error instanceof TypeError) {
    return { title: 'Não foi possível falar com a API. Ela está rodando?' };
  }
  return { title: 'Algo deu errado.', detail: error instanceof Error ? error.message : undefined };
}
