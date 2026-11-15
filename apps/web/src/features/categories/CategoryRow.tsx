import type { CategoryDTO } from '@fintrack/contracts';
import { useState, type FormEvent } from 'react';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { useToast } from '../../shared/ui/Toaster';
import { useDeleteCategory, useRenameCategory } from './hooks';

export function CategoryRow({ category }: { category: CategoryDTO }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const renameCategory = useRenameCategory();
  const deleteCategory = useDeleteCategory();
  const notify = useToast();

  const submitRename = (event: FormEvent) => {
    event.preventDefault();
    renameCategory.mutate(
      { id: category.id, name },
      {
        onSuccess: () => {
          setIsEditing(false);
          notify('Categoria renomeada');
        },
      },
    );
  };

  const cancelRename = () => {
    setName(category.name);
    setIsEditing(false);
    renameCategory.reset();
  };

  const confirmDelete = () => {
    if (window.confirm(`Excluir a categoria "${category.name}"?`)) {
      deleteCategory.mutate(category.id, {
        onSuccess: () => notify(`Categoria "${category.name}" excluída`),
      });
    }
  };

  return (
    <li className="list-row">
      {isEditing ? (
        <form className="list-row__main" onSubmit={submitRename}>
          <input
            aria-label="Novo nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoFocus
            required
          />
          <button
            className="button button--primary button--small"
            disabled={renameCategory.isPending}
          >
            Salvar
          </button>
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={cancelRename}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div className="list-row__main">
          <span className="list-row__title">{category.name}</span>
          <button className="button button--ghost button--small" onClick={() => setIsEditing(true)}>
            Renomear
          </button>
          <button
            className="button button--ghost button--small button--danger"
            onClick={confirmDelete}
            disabled={deleteCategory.isPending}
          >
            Excluir
          </button>
        </div>
      )}
      <ErrorBanner error={renameCategory.error ?? deleteCategory.error} />
    </li>
  );
}
