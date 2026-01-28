import Link from "next/link";

export default function LandingPage() {
  return (
    <div>
      <header className="topbar">
        <div className="topbar__brand">
          <div className="logo">S</div>
          <span>ScoreImob</span>
        </div>
        <nav className="topbar__nav">
          <a href="#solucao">Solução</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#cases">Resultados</a>
          <a href="#seguranca">Segurança</a>
        </nav>
        <div className="topbar__actions">
          <Link className="ghost" href="/login">
            Entrar
          </Link>
          <Link className="solid" href="/signup">
            Criar conta
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero__content">
          <div className="pill">Análise de crédito para imóveis</div>
          <h1>Decida em minutos se o cliente pode comprar o imóvel.</h1>
          <p>
            ScoreImob cruza dados, valida documentos e entrega uma aprovação clara. Mais segurança para a imobiliária,
            menos fricção para o comprador.
          </p>
          <div className="hero__cta">
            <Link className="solid" href="/signup">
              Começar agora
            </Link>
            <a className="ghost" href="#solucao">
              Ver detalhes
            </a>
          </div>
          <div className="hero__trust">
            <div>
              <strong>+92%</strong>
              <span>decisões sem retrabalho</span>
            </div>
            <div>
              <strong>48h → 8min</strong>
              <span>tempo médio de resposta</span>
            </div>
            <div>
              <strong>LGPD ready</strong>
              <span>segurança e consentimento</span>
            </div>
          </div>
        </div>
        <div className="hero__card">
          <div className="metric">
            <span className="metric__label">Pré-aprovação</span>
            <span className="metric__value">R$ 820.000</span>
            <span className="metric__sub">Cliente dentro do perfil</span>
          </div>
          <div className="grid grid--two">
            <div className="mini-card">
              <span className="mini-card__label">Renda validada</span>
              <strong>R$ 21.500</strong>
              <span className="pill pill--soft">Documentos OK</span>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Score interno</span>
              <strong>8.7 / 10</strong>
              <span className="pill pill--soft">Risco baixo</span>
            </div>
          </div>
          <div className="mini-list">
            <div className="mini-list__item">
              <span>Validação antifraude</span>
              <span className="status status--ok">Aprovado</span>
            </div>
            <div className="mini-list__item">
              <span>Comportamento de pagamento</span>
              <span className="status status--warn">Revisar</span>
            </div>
            <div className="mini-list__item">
              <span>Documentos enviados</span>
              <span className="status status--ok">Completos</span>
            </div>
          </div>
        </div>
      </section>

      <section id="solucao" className="section">
        <div className="section__intro">
          <h2>Mais segurança, menos atrito</h2>
          <p>Automatize a análise de crédito e dê respostas rápidas aos clientes.</p>
        </div>
        <div className="grid grid--three">
          <article className="card">
            <h3>Score imobiliário</h3>
            <p>Modelo próprio ajustado para compra de imóveis, considerando perfil, renda e risco.</p>
          </article>
          <article className="card">
            <h3>Documentos validados</h3>
            <p>Upload seguro, OCR e checagens automáticas para reduzir fraudes e retrabalho.</p>
          </article>
          <article className="card">
            <h3>Respostas claras</h3>
            <p>Clientes veem o status em tempo real e recebem próximos passos de forma simples.</p>
          </article>
        </div>
      </section>

      <section id="como-funciona" className="section section--soft">
        <div className="section__intro">
          <h2>Como funciona</h2>
          <p>Do cadastro à decisão em quatro passos.</p>
        </div>
        <div className="steps">
          {[
            { t: "Cadastro rápido", d: "Cliente cria conta, informa renda e envia documentos." },
            { t: "Validação segura", d: "Checagem antifraude, consistência de dados e LGPD aplicada." },
            { t: "Score e decisão", d: "Modelo calcula score e libera pré-aprovação com limites." },
            { t: "Compartilhe com a imobiliária", d: "Envie o relatório para o corretor concluir a compra." },
          ].map((step, idx) => (
            <div className="step" key={step.t}>
              <span className="step__number">{idx + 1}</span>
              <div>
                <h3>{step.t}</h3>
                <p>{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="cases" className="section">
        <div className="section__intro">
          <h2>Resultados para times de vendas</h2>
          <p>Menos tempo avaliando, mais tempo fechando contratos.</p>
        </div>
        <div className="grid grid--two">
          <article className="highlight">
            <h3>Imobiliária Norte</h3>
            <p>Reduziu o ciclo de aprovação de 5 dias para 12 minutos, com 0 fraudes nos últimos 3 meses.</p>
          </article>
          <article className="highlight">
            <h3>Construtora Delta</h3>
            <p>+28% de conversão em vendas financiadas após adotar ScoreImob na jornada online.</p>
          </article>
        </div>
      </section>

      <section id="seguranca" className="section section--soft">
        <div className="section__intro">
          <h2>Segurança e confiança</h2>
          <p>Infra em nuvem, criptografia e controle de acesso.</p>
        </div>
        <div className="grid grid--three">
          <article className="card">
            <h3>LGPD</h3>
            <p>Consentimento expresso, retenção mínima e exclusão sob demanda.</p>
          </article>
          <article className="card">
            <h3>Criptografia</h3>
            <p>Dados em repouso e em trânsito com padrões fortes.</p>
          </article>
          <article className="card">
            <h3>Auditoria</h3>
            <p>Logs de acesso e ações para conformidade e investigação.</p>
          </article>
        </div>
      </section>

      <section className="cta">
        <div>
          <h2>Pronto para aprovar clientes com clareza?</h2>
          <p>Crie sua conta e teste a jornada de análise de crédito.</p>
        </div>
        <div className="cta__actions">
          <Link className="solid" href="/signup">
            Criar conta
          </Link>
          <Link className="ghost" href="/login">
            Entrar
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__brand">
          <div className="logo">S</div>
          <span>ScoreImob</span>
        </div>
        <div className="footer__links">
          <a href="#solucao">Solução</a>
          <a href="#seguranca">Segurança</a>
          <Link href="/login">Login</Link>
          <Link href="/signup">Cadastro</Link>
        </div>
        <p className="footer__note">© 2025 ScoreImob. Segurança e clareza para o crédito imobiliário.</p>
      </footer>
    </div>
  );
}
