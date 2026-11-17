import type { CSSProperties } from 'react';
import { useScrollProgress } from './useScrollProgress';

/** De cima para baixo, como as camadas aparecem empilhadas. */
const LAYERS = [
  {
    name: 'Apresentação',
    text: 'Rotas HTTP com Hono no Worker e telas em React. Só traduz pedidos e respostas.',
  },
  {
    name: 'Infraestrutura',
    text: 'Repositórios no D1, hash de senha e token de sessão com a WebCrypto do Worker.',
  },
  {
    name: 'Aplicação',
    text: 'Casos de uso como registrar um lançamento ou montar o dashboard do período.',
  },
  {
    name: 'Domínio',
    text: 'Dinheiro em centavos, datas, categorias e as regras que não podem ser quebradas.',
  },
] as const;

const STACK = [
  'Cloudflare Workers',
  'D1',
  'Pages',
  'Hono',
  'React',
  'Vite',
  'TanStack Query',
  'Zod',
  'Vitest',
  'Playwright',
];

const REPOSITORY_URL = 'https://github.com/Felipecluiz/Fintrack';

/**
 * Para quem quer saber como foi feito: as camadas da Clean Architecture se
 * afastam conforme a seção entra na tela, como uma vista explodida.
 */
export function UnderTheHood() {
  const [sectionRef, scroll] = useScrollProgress<HTMLElement>('pass');

  return (
    <section
      ref={sectionRef}
      id="por-dentro"
      className="hood"
      aria-labelledby="hood-title"
      style={{ '--spread': scroll.progress } as CSSProperties}
    >
      <div className="hood__copy">
        <h2 id="hood-title">Por dentro do projeto</h2>
        <p className="hood__lead">
          O Fintrack é um projeto de portfólio. Cada funcionalidade começa como uma especificação
          com critérios de aceite, e cada critério vira um teste automatizado.
        </p>
        <ul className="hood__stack" aria-label="Tecnologias">
          {STACK.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a className="button button--secondary" href={REPOSITORY_URL} rel="noreferrer">
          Ver o código no GitHub
        </a>
      </div>

      <ol className="hood__layers" aria-label="Camadas da aplicação, de fora para dentro">
        {LAYERS.map((layer, index) => (
          <li
            key={layer.name}
            className="hood__layer"
            style={{ '--depth': LAYERS.length - 1 - index } as CSSProperties}
          >
            <span className="hood__plate" aria-hidden="true" />
            <div className="hood__label">
              <h3>{layer.name}</h3>
              <p>{layer.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
