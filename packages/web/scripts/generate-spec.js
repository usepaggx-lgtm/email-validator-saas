const fs = require('fs')
const path = require('path')

const apiBase = 'https://email-validator-api.cristiano-developers4897.workers.dev'

const baseSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Consultas API',
    version: '1.0.0',
    description: 'API de consulta a dados cadastrais, financeiros, judiciais, de compliance e crédito de pessoas e empresas brasileiras. Mais de 150 bases de dados organizadas em 9 grupos de API, cada dataset com seu próprio endpoint dedicado.'
  },
  servers: [{ url: apiBase, description: 'Produção' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token obtido no login. Enviar no header: `Authorization: Bearer {token}`' }
    },
    schemas: {
      QueryResponse: {
        type: 'object',
        properties: {
          Result: { type: 'array', items: { type: 'object' }, description: 'Array de resultados. Estrutura varia por dataset.' },
          QueryId: { type: 'string' },
          ElapsedMilliseconds: { type: 'integer' },
          Status: { type: 'string', enum: ['OK', 'ERROR', 'NO_DATA'] },
          _meta: { type: 'object', properties: {
            balance_cents: { type: 'integer' },
            cost_cents: { type: 'integer' },
            elapsed_ms: { type: 'integer' }
          }}
        }
      },
      Error: { type: 'object', properties: { error: { type: 'string' }, detail: { type: 'string' } } },
      InsufficientCredits: { type: 'object', properties: {
        error: { type: 'string', example: 'Saldo insuficiente' },
        required_cents: { type: 'integer' },
        balance_cents: { type: 'integer' }
      }}
    }
  },
  'x-tagGroups': [],
  tags: [],
  paths: {}
}

const apiGroups = [
  { key: 'pessoas', name: 'API de Pessoas', subgroups: ['Dados Básicos', 'Contatos', 'Compliance Regulatório', 'Comportamento', 'Econômicos e Financeiros', 'Envolvimento Político', 'Exposição Pública', 'Presença Digital', 'Processos Judiciais', 'Profissionais', 'Risco', 'Sócio-Demográficos', 'Veículos'] },
  { key: 'empresas', name: 'API de Empresas', subgroups: ['Ativos', 'Dados Básicos', 'Contato', 'Compliance Regulatório', 'Econômicos', 'Envolvimento Político', 'ESG', 'Exposição Pública', 'Presença Digital', 'Processos Judiciais', 'Reputação', 'Risco', 'Setoriais', 'Relacionamentos', 'Comportamento'] },
  { key: 'enderecos', name: 'API de Endereços', subgroups: ['Atividade Econômica', 'Dados Básicos', 'Propriedades Rurais', 'Proteção Ambiental e Cultural', 'Risco e Segurança Pública', 'População'] },
  { key: 'veiculos', name: 'API de Veículos', subgroups: ['Dados Básicos'] },
  { key: 'processos', name: 'API de Processos', subgroups: ['Outros Processos'] },
  { key: 'produtos', name: 'API de Produtos', subgroups: ['Dados Básicos', 'Precificação', 'Relacionamentos', 'Reputação'] },
  { key: 'ondemand', name: 'API On-Demand', subgroups: ['Certidões de Empresas', 'Certidões de Pessoas', 'Certidões de Endereços', 'Consultas de Empresas', 'Consultas de Pessoas', 'Consultas de Veículos', 'Consultas de Notas Fiscais'] },
  { key: 'marketplace', name: 'API Marketplace', subgroups: ['Crédito - Empresas', 'Crédito - Pessoas', 'Empresas', 'Endereços', 'Telefones', 'IP'] },
  { key: 'modelagem', name: 'API de Modelagem', subgroups: ['Pessoas', 'Empresas'] },
]

const datasets = [
  // PESSOAS | Dados Básicos
  { g: 'pessoas', s: 'Dados Básicos', k: 'basic_data', n: 'Dados Básicos', d: 'Dados cadastrais consolidados: nome, CPF, data de nascimento, filiação, situação do CPF, sexo, nacionalidade, naturalidade.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Dados Básicos', k: 'basic_data_recent', n: 'Dados Básicos com Recência Configurável', d: 'Dados cadastrais filtrados por janela temporal configurável.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Dados Básicos', k: 'basic_data_history', n: 'Histórico de Dados Básicos', d: 'Alterações cadastrais ao longo do tempo com datas de observação.', q: 'doc{12345678909}' },
  // PESSOAS | Contatos
  { g: 'pessoas', s: 'Contatos', k: 'emails', n: 'E-mails', d: 'E-mails associados à pessoa com status de validação, datas de referência e recorrência.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Contatos', k: 'related_emails', n: 'E-mails de Pessoas Relacionadas', d: 'E-mails de familiares, sócios e co-residentes.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Contatos', k: 'phones', n: 'Telefones', d: 'Telefones com tipo, status, operadora, estabilidade e recorrência.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Contatos', k: 'related_phones', n: 'Telefones de Pessoas Relacionadas', d: 'Telefones de pessoas relacionadas.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Contatos', k: 'addresses', n: 'Endereços', d: 'Endereços com tipo, completude, datas de referência e estabilidade.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Contatos', k: 'related_addresses', n: 'Endereços de Pessoas Relacionadas', d: 'Endereços de pessoas relacionadas.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Contatos', k: 'registration_data', n: 'Dados de Registro', d: 'Identificação + contatos consolidados para validação cadastral.', q: 'doc{12345678909}' },
  // PESSOAS | Compliance Regulatório
  { g: 'pessoas', s: 'Compliance Regulatório', k: 'kyc_compliance', n: 'KYC e Compliance', d: 'Indicadores de PEP, listas restritivas, impedimentos públicos e score de risco regulatório.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Compliance Regulatório', k: 'kyc_compliance_family', n: 'KYC e Compliance dos Familiares de Primeiro Nível', d: 'Dados de compliance de familiares de primeiro nível.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Compliance Regulatório', k: 'gambling_compliance', n: 'Compliance de Casas de Apostas', d: 'Participação societária em empresas de apostas online.', q: 'doc{12345678909}' },
  // PESSOAS | Comportamento
  { g: 'pessoas', s: 'Comportamento', k: 'online_presence', n: 'Presença Online', d: 'Intensidade de presença digital em bandas A-H (30/90/180/365 dias).', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Comportamento', k: 'family_online_presence', n: 'Presença Online Familiar', d: 'Atividade digital agregada do núcleo familiar.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Comportamento', k: 'web_passages', n: 'Passagens pela Web', d: 'Ocorrências na web qualificadas como positivas, negativas ou neutras.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Comportamento', k: 'online_betting_propensity', n: 'Propensão a Apostas Online', d: 'Score de propensão em banda A-H.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Comportamento', k: 'digital_financial_behavior', n: 'Comportamento Financeiro Digital', d: 'Classificação A-H de maturidade financeira digital.', q: 'doc{12345678909}' },
  // PESSOAS | Econômicos e Financeiros
  { g: 'pessoas', s: 'Econômicos e Financeiros', k: 'financial_info', n: 'Informações Financeiras', d: 'Indicadores financeiros: renda estimada, situação empregatícia, vínculos previdenciários.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Econômicos e Financeiros', k: 'family_financial_info', n: 'Informações Financeiras Familiares', d: 'Indicadores financeiros do núcleo familiar.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Econômicos e Financeiros', k: 'social_benefits', n: 'Programas de Benefícios Sociais', d: 'Participação em programas de transferência de renda.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Econômicos e Financeiros', k: 'family_social_benefits', n: 'Benefícios Sociais Familiares', d: 'Benefícios sociais de familiares.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Econômicos e Financeiros', k: 'industrial_property', n: 'Propriedades Industriais', d: 'Marcas e patentes registradas.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Econômicos e Financeiros', k: 'government_debtors', n: 'Devedores do Governo', d: 'Registros de dívidas ativas com órgãos públicos.', q: 'doc{12345678909}' },
  // PESSOAS | Envolvimento Político
  { g: 'pessoas', s: 'Envolvimento Político', k: 'political_involvement_level', n: 'Nível de Envolvimento Político', d: 'Indicador consolidado de participação eleitoral, doações e cargos.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Envolvimento Político', k: 'electoral_candidates', n: 'Candidatos Eleitorais', d: 'Histórico de candidaturas: cargo, partido, ano, resultado.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Envolvimento Político', k: 'electoral_donations', n: 'Doações Eleitorais', d: 'Doações eleitorais realizadas ou recebidas.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Envolvimento Político', k: 'family_political_history', n: 'Histórico Político Familiar', d: 'Envolvimento político de familiares.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Envolvimento Político', k: 'electoral_service_providers', n: 'Prestadores de Serviços Eleitorais', d: 'Vínculos com campanhas, partidos ou estruturas políticas.', q: 'doc{12345678909}' },
  // PESSOAS | Exposição Pública
  { g: 'pessoas', s: 'Exposição Pública', k: 'popularity_data', n: 'Dados de Popularidade', d: 'Indicador de influência pública consolidado.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Exposição Pública', k: 'media_exposure', n: 'Exposição e Perfil na Mídia', d: 'Frequência, visibilidade e sentimento em conteúdo jornalístico.', q: 'doc{12345678909}' },
  // PESSOAS | Presença Digital
  { g: 'pessoas', s: 'Presença Digital', k: 'online_ads', n: 'Anúncios Online', d: 'Perfis de anunciante em portais e marketplaces.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Presença Digital', k: 'website_data', n: 'Dados de Sites', d: 'Sites e domínios associados.', q: 'doc{12345678909}' },
  // PESSOAS | Processos Judiciais
  { g: 'pessoas', s: 'Processos Judiciais', k: 'processes', n: 'Processos Judiciais e Administrativos', d: 'Processos cíveis, trabalhistas, criminais e administrativos.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Processos Judiciais', k: 'family_processes', n: 'Processos Judiciais Familiares', d: 'Processos de familiares de primeiro grau.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Processos Judiciais', k: 'process_distribution', n: 'Distribuição de Processos', d: 'Visão agregada: distribuição por tipo, instância e status.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Processos Judiciais', k: 'family_process_distribution', n: 'Distribuição de Processos Familiares', d: 'Indicadores agregados de processos de familiares.', q: 'doc{12345678909}' },
  // PESSOAS | Profissionais
  { g: 'pessoas', s: 'Profissionais', k: 'professional_data', n: 'Dados Profissionais', d: 'Ocupação, cargos, áreas de atuação, empregadores.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Profissionais', k: 'professional_turnover', n: 'Turnover Profissional', d: 'Indicadores de mudanças profissionais.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Profissionais', k: 'academic_history', n: 'Histórico Escolar e Acadêmico', d: 'Cursos, graduação, pós, MBA.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Profissionais', k: 'awards_certifications', n: 'Prêmios e Certificações', d: 'Reconhecimentos públicos e certificações.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Profissionais', k: 'licenses_authorizations', n: 'Licenças e Autorizações', d: 'Permissões profissionais.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Profissionais', k: 'professional_councils', n: 'Conselhos de Classe', d: 'Inscrição em conselhos profissionais (CRM, OAB, CREA, CRC).', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Profissionais', k: 'public_servants', n: 'Servidores Públicos', d: 'Vínculos com a administração pública.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Profissionais', k: 'sports_exposure', n: 'Exposição Esportiva', d: 'Participação esportiva: competições, clubes.', q: 'doc{12345678909}' },
  // PESSOAS | Risco
  { g: 'pessoas', s: 'Risco', k: 'financial_risk', n: 'Risco Financeiro', d: 'Inadimplência, dívidas ativas, scores de risco.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Risco', k: 'family_financial_risk', n: 'Risco Financeiro Familiar', d: 'Risco financeiro de familiares.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Risco', k: 'collection_presence', n: 'Presença em Cobrança', d: 'Ocorrências em processos de cobrança.', q: 'doc{12345678909}' },
  { g: 'pessoas', s: 'Risco', k: 'default_probability', n: 'Probabilidade de Negativação', d: 'Score preditivo de negativação futura.', q: 'doc{12345678909}' },
  // PESSOAS | Sócio-Demográficos
  { g: 'pessoas', s: 'Sócio-Demográficos', k: 'sociodemographic_info', n: 'Informações Sócio-Demográficas', d: 'Perfil populacional da região (IBGE).', q: 'doc{12345678909}' },
  // PESSOAS | Veículos
  { g: 'pessoas', s: 'Veículos', k: 'vehicles', n: 'Veículos Associados', d: 'Veículos relacionados por anúncios e bases públicas.', q: 'doc{12345678909}' },
  // EMPRESAS
  { g: 'empresas', s: 'Dados Básicos', k: 'company_basic_data', n: 'Dados Básicos', d: 'Dados cadastrais consolidados: razão social, CNPJ, data de abertura, CNAE.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Dados Básicos', k: 'company_basic_data_history', n: 'Histórico de Dados Básicos', d: 'Alterações cadastrais ao longo do tempo.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Dados Básicos', k: 'mcc_data', n: 'Categoria Comercial MCC', d: 'Código MCC para classificação de serviços financeiros.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Contato', k: 'company_registration_data', n: 'Dados de Registro', d: 'Identificação + contatos consolidados.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Contato', k: 'company_emails', n: 'E-mails', d: 'E-mails da empresa.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Contato', k: 'company_related_emails', n: 'E-mails de Relacionados', d: 'E-mails de pessoas relacionadas.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Contato', k: 'company_phones', n: 'Telefones', d: 'Telefones da empresa.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Contato', k: 'company_related_phones', n: 'Telefones de Relacionados', d: 'Telefones de pessoas relacionadas.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Contato', k: 'company_addresses', n: 'Endereços', d: 'Endereços da empresa.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Contato', k: 'company_related_addresses', n: 'Endereços de Relacionados', d: 'Endereços de pessoas relacionadas.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Compliance Regulatório', k: 'company_kyc_compliance', n: 'KYC e Compliance', d: 'PEP, sanções, restrições.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Compliance Regulatório', k: 'partner_kyc_compliance', n: 'KYC dos Sócios', d: 'Compliance dos sócios.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Compliance Regulatório', k: 'employee_kyc_compliance', n: 'KYC dos Funcionários', d: 'Compliance dos funcionários.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Compliance Regulatório', k: 'economic_group_kyc_compliance', n: 'KYC do Grupo Econômico', d: 'Compliance de todo o grupo.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Ativos', k: 'company_industrial_property', n: 'Propriedades Industriais', d: 'Marcas e patentes.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Ativos', k: 'employee_industrial_property', n: 'Propriedades Industriais de Funcionários', d: 'Propriedade intelectual de funcionários.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Ativos', k: 'partner_industrial_property', n: 'Propriedades Industriais de Sócios', d: 'Propriedade intelectual de sócios.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Econômicos', k: 'company_evolution', n: 'Evolução da Empresa', d: 'Capital social, funcionários e sócios ao longo do tempo.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Econômicos', k: 'activity_indicators', n: 'Indicadores de Atividade', d: 'Faixa de receita, funcionários, presença digital.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Envolvimento Político', k: 'company_political_involvement', n: 'Envolvimento Político', d: 'Score de participação política do quadro societário.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Envolvimento Político', k: 'company_electoral_donations', n: 'Doações Eleitorais', d: 'Doações da empresa.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Envolvimento Político', k: 'partner_electoral_donations', n: 'Doações Eleitorais de Sócios', d: 'Doações de sócios.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'ESG', k: 'union_agreements', n: 'Acordos Sindicais', d: 'Convenções coletivas de trabalho.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'ESG', k: 'social_awareness', n: 'Consciência Social', d: 'Acessibilidade, diversidade, gap salarial.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Exposição Pública', k: 'company_media_exposure', n: 'Exposição na Mídia', d: 'Presença em conteúdo jornalístico.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Exposição Pública', k: 'shareholder_influence', n: 'Influência do Quadro Societário', d: 'Influência inferida do quadro de sócios.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Presença Digital', k: 'company_online_ads', n: 'Anúncios Online', d: 'Perfis em marketplaces.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Presença Digital', k: 'company_website_data', n: 'Dados de Sites', d: 'Sites, domínios, tecnologias.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Presença Digital', k: 'marketplaces', n: 'Marketplaces', d: 'Presença em e-commerce.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Processos Judiciais', k: 'company_processes', n: 'Processos Judiciais', d: 'Processos da empresa.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Processos Judiciais', k: 'partner_processes', n: 'Processos dos Sócios', d: 'Processos dos sócios.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Processos Judiciais', k: 'company_process_distribution', n: 'Distribuição de Processos', d: 'Dados agregados.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Processos Judiciais', k: 'partner_process_distribution', n: 'Distribuição de Processos dos Sócios', d: 'Dados agregados dos sócios.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Relacionamentos', k: 'company_relationships', n: 'Relacionamentos', d: 'Entidades com vínculo com a empresa.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Relacionamentos', k: 'economic_group_relationships', n: 'Relacionamentos do Grupo Econômico', d: 'Entidades do mesmo grupo.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Relacionamentos', k: 'qsa_recent', n: 'QSA com Recência Configurável', d: 'Estrutura societária em tempo real.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Reputação', k: 'reviews_reputation', n: 'Avaliações e Reputação', d: 'Reputação em múltiplas plataformas.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Reputação', k: 'company_awards_certifications', n: 'Prêmios e Certificações', d: 'Prêmios e certificações.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Risco', k: 'company_collection_presence', n: 'Presença em Cobrança', d: 'Passagem por cobrança.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Risco', k: 'company_government_debtors', n: 'Devedores do Governo', d: 'Dívida ativa e FGTS.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Setoriais', k: 'investment_funds_data', n: 'Fundos de Investimento', d: 'Empresas registradas na CVM.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Setoriais', k: 'civil_works_data', n: 'Obras Civis', d: 'Obras registradas no CNO.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Setoriais', k: 'financial_market_data', n: 'Mercado Financeiro', d: 'Balanço e estrutura acionária.', q: 'doc{11222333000181}' },
  { g: 'empresas', s: 'Comportamento', k: 'company_digital_financial_behavior', n: 'Comportamento Financeiro Digital', d: 'Classificação A-H de maturidade.', q: 'doc{11222333000181}' },
  // ENDEREÇOS
  { g: 'enderecos', s: 'Atividade Econômica', k: 'company_statistics', n: 'Estatísticas de Empresas', d: 'Perfil econômico da região.', q: 'cep{01310100}' },
  { g: 'enderecos', s: 'Dados Básicos', k: 'municipalities', n: 'Municípios', d: 'Dados de municípios.', q: 'polygon{POLYGON}' },
  { g: 'enderecos', s: 'Propriedades Rurais', k: 'sicar_properties', n: 'Propriedades Rurais SICAR', d: 'Propriedades do CAR.', q: 'car{CAR_ID}' },
  { g: 'enderecos', s: 'Proteção Ambiental e Cultural', k: 'amazon_legal', n: 'Amazônia Legal', d: 'Indicador de Amazônia Legal.', q: 'cep{01310100}' },
  { g: 'enderecos', s: 'Proteção Ambiental e Cultural', k: 'environmental_protection_areas', n: 'Áreas de Proteção Ambiental', d: 'Presença de APA.', q: 'cep{01310100}' },
  { g: 'enderecos', s: 'Proteção Ambiental e Cultural', k: 'biomes', n: 'Biomas', d: 'Informação de bioma.', q: 'cep{01310100}' },
  { g: 'enderecos', s: 'Proteção Ambiental e Cultural', k: 'icmbio_embargoed_areas', n: 'Áreas Embargadas ICMBio', d: 'Embargos ambientais.', q: 'car{CAR_ID}' },
  { g: 'enderecos', s: 'Proteção Ambiental e Cultural', k: 'sicar_legal_reserves', n: 'Reservas Legais SICAR', d: 'Proximidade de reservas.', q: 'car{CAR_ID}' },
  { g: 'enderecos', s: 'Proteção Ambiental e Cultural', k: 'archaeological_sites', n: 'Sítios Arqueológicos', d: 'Sítios arqueológicos.', q: 'cep{01310100}' },
  { g: 'enderecos', s: 'Proteção Ambiental e Cultural', k: 'indigenous_lands', n: 'Terras Indígenas', d: 'Proximidade de terras.', q: 'cep{01310100}' },
  { g: 'enderecos', s: 'Proteção Ambiental e Cultural', k: 'conservation_units', n: 'Unidades de Conservação', d: 'Presença de UC.', q: 'cep{01310100}' },
  { g: 'enderecos', s: 'Proteção Ambiental e Cultural', k: 'agroecological_zoning', n: 'Zoneamento Agroecológico', d: 'Aptidão agrícola.', q: 'cep{01310100}' },
  { g: 'enderecos', s: 'Risco e Segurança Pública', k: 'address_risk_area', n: 'Áreas de Risco', d: 'Proximidade de áreas de risco.', q: 'cep{01310100}' },
  { g: 'enderecos', s: 'Risco e Segurança Pública', k: 'crime_statistics', n: 'Estatísticas Criminais', d: 'Incidência criminal (MG, SP, RJ).', q: 'cep{01310100}' },
  // VEÍCULOS
  { g: 'veiculos', s: 'Dados Básicos', k: 'vehicle_plate_history', n: 'Histórico de Placa', d: 'Dados cadastrais e históricos.', q: 'plate{ABC1234}' },
  // PROCESSOS
  { g: 'processos', s: 'Outros Processos', k: 'cade_processes', n: 'Processos do CADE', d: 'Processos do CADE.', q: 'process_number{NR}' },
  // PRODUTOS
  { g: 'produtos', s: 'Dados Básicos', k: 'product_specifications', n: 'Ficha Técnica', d: 'Características técnicas.', q: 'url{URL}' },
  { g: 'produtos', s: 'Dados Básicos', k: 'product_images', n: 'Imagens do Produto', d: 'Imagens atuais e históricas.', q: 'url{URL}' },
  { g: 'produtos', s: 'Precificação', k: 'current_price', n: 'Preço Atual', d: 'Preços em diferentes fontes.', q: 'url{URL}' },
  { g: 'produtos', s: 'Precificação', k: 'price_history', n: 'Histórico de Preços', d: 'Evolução de preços.', q: 'url{URL}' },
  { g: 'produtos', s: 'Relacionamentos', k: 'related_products', n: 'Produtos Relacionados', d: 'Produtos associados.', q: 'url{URL}' },
  { g: 'produtos', s: 'Reputação', k: 'product_ratings', n: 'Notas e Avaliações', d: 'Avaliações de lojas.', q: 'url{URL}' },
  // ONDEMAND
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'labor_claims_certificate', n: 'Ações Trabalhistas', d: 'Certidão de ações trabalhistas.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'disabled_persons_hiring', n: 'Contratação de PCD', d: 'Compliance para >100 funcionários.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'cgu_negative_certificate', n: 'CGU Negativa', d: 'Sanções: CEIS, CNEP, CEPIM.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'cnj_negative_certificate', n: 'CNJ Negativa', d: 'Condenações por improbidade.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'state_debts_negative', n: 'Débitos Estaduais Negativa', d: 'Ausência de débitos estaduais.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'labor_debts_negative', n: 'Débitos Trabalhistas Negativa', d: 'Ausência de débitos trabalhistas.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'fgts_certificate', n: 'FGTS', d: 'Regularidade do FGTS.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'comex_habilitation', n: 'Habilitação COMEX', d: 'Comércio exterior.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'ibama_embargoes_certificate', n: 'IBAMA Embargos', d: 'Embargos ambientais.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'ibama_negative_certificate', n: 'IBAMA Negativa', d: 'Nada consta ambiental.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'ibama_regulatory', n: 'IBAMA Regulatória', d: 'Obrigações ambientais.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'irt_certificate', n: 'IRT', d: 'Débito fiscal rural.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'health_licenses', n: 'Licenças Sanitárias', d: 'Licenças (SP).', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'pgfn_certificate', n: 'PGFN', d: 'Débitos federais.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Empresas', k: 'siproquim', n: 'SIPROQUIM', d: 'Produtos químicos.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Certidões de Endereços', k: 'sicar_certificate', n: 'SICAR', d: 'Certidão do CAR.', q: 'car{CAR_ID}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'federal_court_lawsuit_certificate', n: 'Ações Judiciais Nada Consta', d: 'Nada consta de tribunais federais.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_labor_claims', n: 'Ações Trabalhistas (Pessoa)', d: 'Certidão trabalhista.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'cgu_correctional_negative', n: 'CGU Correcional Negativa', d: 'Sanções ePAD.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_cnj_negative', n: 'CNJ Negativa (Pessoa)', d: 'Condenações.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_state_debts_negative', n: 'Débitos Estaduais Negativa (Pessoa)', d: 'Sem débitos estaduais.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_labor_debts_negative', n: 'Débitos Trabalhistas Negativa (Pessoa)', d: 'Sem débitos trabalhistas.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_ibama_embargoes', n: 'IBAMA Embargos (Pessoa)', d: 'Embargados pelo IBAMA.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_ibama_negative', n: 'IBAMA Negativa (Pessoa)', d: 'Nada consta.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_ibama_regularity', n: 'IBAMA Regularidade', d: 'Regularidade IBAMA.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_irt', n: 'IRT (Pessoa)', d: 'Débito rural.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_health_licenses', n: 'Licenças Sanitárias (Pessoa)', d: 'Licenças.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'person_pgfn', n: 'PGFN (Pessoa)', d: 'Débitos federais.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'civil_police_criminal_record', n: 'Antecedentes Criminais (Polícia Civil)', d: 'Antecedentes estaduais.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'federal_police_criminal_record', n: 'Antecedentes Criminais (Polícia Federal)', d: 'Antecedentes federais.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Certidões de Pessoas', k: 'tse_electoral_certificate', n: 'TSE Quitação Eleitoral', d: 'Quitação eleitoral.', q: 'doc{12345678909}' },
  // ONDEMAND | Consultas de Empresas
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'mei_das_collection', n: 'Arrecadação MEI', d: 'Histórico DAS.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'cadin_debts', n: 'CADIN Débitos', d: 'Registro em CADIN.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'comprot_processes', n: 'COMPROT Processos', d: 'Processos no MF.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'municipal_registration', n: 'Inscrição Municipal', d: 'Inscrição municipal.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'simples_nacional_optant', n: 'Optante Simples Nacional', d: 'Status Simples.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'public_projects', n: 'Projetos Públicos', d: 'Projetos com financiamento público.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'qsa_receita', n: 'QSA Receita Federal', d: 'Quadro societário RFB.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'legal_representative', n: 'Representante Legal RFB', d: 'Representantes.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'cnpj_situation', n: 'Situação CNPJ', d: 'Situação cadastral.', q: 'doc{11222333000181}' },
  { g: 'ondemand', s: 'Consultas de Empresas', k: 'sintegra', n: 'SINTEGRA', d: 'Inscrição estadual.', q: 'doc{11222333000181}' },
  // ONDEMAND | Consultas de Pessoas
  { g: 'ondemand', s: 'Consultas de Pessoas', k: 'bacen_sanctions', n: 'BACEN Sanções', d: 'Sanções do BCB.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Consultas de Pessoas', k: 'person_cadin_debts', n: 'CADIN Débitos (Pessoa)', d: 'Registro CADIN.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Consultas de Pessoas', k: 'person_comprot_processes', n: 'COMPROT Processos (Pessoa)', d: 'Processos.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Consultas de Pessoas', k: 'detran_traffic_fines', n: 'DETRAN Multas', d: 'Infrações de trânsito.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Consultas de Pessoas', k: 'cpf_status', n: 'Status do CPF', d: 'Situação do CPF na RFB.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Consultas de Pessoas', k: 'person_sintegra', n: 'SINTEGRA (Pessoa)', d: 'Inscrição estadual.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Consultas de Pessoas', k: 'sus_card', n: 'SUS Cartão', d: 'Número do cartão SUS.', q: 'doc{12345678909}' },
  { g: 'ondemand', s: 'Consultas de Pessoas', k: 'tse_voting_location', n: 'TSE Local de Votação', d: 'Local de votação.', q: 'doc{12345678909}' },
  // ONDEMAND | Notas Fiscais
  { g: 'ondemand', s: 'Consultas de Notas Fiscais', k: 'cte', n: 'CTe', d: 'Conhecimento de Transporte.', q: 'cte_key{CHAVE}' },
  { g: 'ondemand', s: 'Consultas de Notas Fiscais', k: 'nfe', n: 'NFe', d: 'Nota Fiscal Eletrônica.', q: 'nfe_key{CHAVE}' },
  // ONDEMAND | Veículos
  { g: 'ondemand', s: 'Consultas de Veículos', k: 'detran_chassis_renavam', n: 'Chassi e Renavam', d: 'Dados do veículo.', q: 'plate{ABC1234}' },
  { g: 'ondemand', s: 'Consultas de Veículos', k: 'rntrc_transporters', n: 'RNTRC Transportadores', d: 'Registro de transportadores.', q: 'plate{ABC1234}' },
  // MARKETPLACE
  { g: 'marketplace', s: 'Crédito - Empresas', k: 'scr_positive_score', n: 'SCR Score Positivo', d: 'Sistema de Informações de Crédito do BCB.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Crédito - Empresas', k: 'bureau_restrictive_data', n: 'Dados Restritivos (Birô)', d: 'Cadastral + negativos + score.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Crédito - Empresas', k: 'quod_restrictive_data', n: 'Dados Restritivos (Quod)', d: 'Sinais de risco.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Crédito - Empresas', k: 'quod_negative_flags', n: 'Flags Negativos (Quod)', d: 'Marcadores negativos.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Crédito - Empresas', k: 'multidata_credit_score', n: 'Score Multidados (Birô)', d: 'Score consolidado.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Crédito - Empresas', k: 'murabei_credit_score', n: 'Score Murabei', d: 'Score 0-1000.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Crédito - Empresas', k: 'quantum_credit_score', n: 'Score Quantum', d: 'Score 0-999.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Crédito - Empresas', k: 'quod_credit_score', n: 'Score Quod', d: 'Score 300-1000.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Crédito - Pessoas', k: 'b2e_risk_classification', n: 'Classificação de Risco (B2E)', d: 'Risco de fraude.', q: 'doc{12345678909}' },
  { g: 'marketplace', s: 'Crédito - Pessoas', k: 'person_scr_positive_score', n: 'SCR Score Positivo (Pessoa)', d: 'SCR do BCB.', q: 'doc{12345678909}' },
  { g: 'marketplace', s: 'Crédito - Pessoas', k: 'person_bureau_restrictive', n: 'Dados Restritivos Birô (Pessoa)', d: 'Restritivos + score.', q: 'doc{12345678909}' },
  { g: 'marketplace', s: 'Crédito - Pessoas', k: 'person_quod_restrictive', n: 'Dados Restritivos Quod (Pessoa)', d: 'Risco de crédito.', q: 'doc{12345678909}' },
  { g: 'marketplace', s: 'Crédito - Pessoas', k: 'person_quod_negative_flags', n: 'Flags Negativos Quod (Pessoa)', d: 'Eventos negativos.', q: 'doc{12345678909}' },
  { g: 'marketplace', s: 'Crédito - Pessoas', k: 'person_multidata_score', n: 'Score Multidados (Pessoa)', d: 'Score consolidado.', q: 'doc{12345678909}' },
  { g: 'marketplace', s: 'Crédito - Pessoas', k: 'person_quantum_score', n: 'Score Quantum (Pessoa)', d: 'Score de inadimplência.', q: 'doc{12345678909}' },
  { g: 'marketplace', s: 'Crédito - Pessoas', k: 'person_quod_score', n: 'Score Quod (Pessoa)', d: 'Score + capacidade.', q: 'doc{12345678909}' },
  { g: 'marketplace', s: 'Crédito - Pessoas', k: 'quantum_revolving_score', n: 'Score Rotativo Quantum', d: 'Risco de crédito rotativo.', q: 'doc{12345678909}' },
  { g: 'marketplace', s: 'Empresas', k: 'shareholding_percentage', n: 'Percentual Societário', d: 'Participação por sócio.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Empresas', k: 'ubo_final_beneficiaries', n: 'UBO (Beneficiários Finais)', d: 'Beneficiários com >20%.', q: 'doc{11222333000181}' },
  { g: 'marketplace', s: 'Endereços', k: 'fuel_prices_region', n: 'Preços de Combustível (Triad)', d: 'Preços na região.', q: 'latlong{-23.5505,-46.6333}' },
  { g: 'marketplace', s: 'Endereços', k: 'property_qualification', n: 'Qualificação do Imóvel', d: 'Atributos do imóvel.', q: 'cep{01310100}' },
  { g: 'marketplace', s: 'Telefones', k: 'device_cadaster_telesign', n: 'Dados de Aparelho (Telesign)', d: 'Tipo, operadora.', q: 'phone{5511999999999}' },
  { g: 'marketplace', s: 'Telefones', k: 'portability_history_telesign', n: 'Portabilidade (Telesign)', d: 'Histórico de portabilidade.', q: 'phone{5511999999999}' },
  { g: 'marketplace', s: 'Telefones', k: 'quality_score_blu365', n: 'Score de Qualidade (BLU365)', d: 'Probabilidade de entrega.', q: 'phone{5511999999999}' },
  { g: 'marketplace', s: 'Telefones', k: 'risk_score_telesign', n: 'Score de Risco (Telesign)', d: 'Risco do telefone.', q: 'phone{5511999999999}' },
  { g: 'marketplace', s: 'Telefones', k: 'sms_delivery_status_blu365', n: 'Status de Entrega SMS (BLU365)', d: 'Status da última tentativa.', q: 'phone{5511999999999}' },
  { g: 'marketplace', s: 'Telefones', k: 'portability_status_telesign', n: 'Status de Portabilidade (Telesign)', d: 'Operadora atual.', q: 'phone{5511999999999}' },
  { g: 'marketplace', s: 'Telefones', k: 'subscriber_status_telesign', n: 'Status do Assinante (Telesign)', d: 'Plano, status, tempo.', q: 'phone{5511999999999}' },
  { g: 'marketplace', s: 'IP', k: 'ip_risk_data', n: 'Dados de Risco do IP', d: 'Geolocalização, proxy, VPN.', q: 'ip{200.150.100.50}' },
  // MODELAGEM
  { g: 'modelagem', s: 'Pessoas', k: 'unified_modeling_x1_0_person', n: 'Modelagem x1.0 (Pessoa)', d: 'Atributos essenciais.', q: 'doc{12345678909}' },
  { g: 'modelagem', s: 'Pessoas', k: 'unified_modeling_x1_5_person', n: 'Modelagem x1.5 (Pessoa)', d: 'Atributos expandidos.', q: 'doc{12345678909}' },
  { g: 'modelagem', s: 'Empresas', k: 'unified_modeling_x1_0_company', n: 'Modelagem x1.0 (Empresa)', d: 'Variáveis consolidadas.', q: 'doc{11222333000181}' },
  { g: 'modelagem', s: 'Empresas', k: 'unified_modeling_x1_5_company', n: 'Modelagem x1.5 (Empresa)', d: 'Dataset expandido.', q: 'doc{11222333000181}' },
]

function queryLabel(q) {
  if (q.startsWith('doc{')) {
    const inner = q.slice(4, -1)
    if (inner.length >= 14 || inner.startsWith('11222')) return 'CNPJ da empresa (apenas números)'
    return 'CPF da pessoa (apenas números)'
  }
  if (q.startsWith('plate{')) return 'Placa do veículo (formato antigo, ex: ABC1234)'
  if (q.startsWith('cep{')) return 'CEP (apenas números, ex: 01310100)'
  if (q.startsWith('phone{')) return 'Telefone com DDI (ex: 5511999999999)'
  if (q.startsWith('ip{')) return 'Endereço IP (ex: 200.150.100.50)'
  if (q.startsWith('latlong{')) return 'Coordenadas geográficas (ex: -23.5505,-46.6333)'
  if (q.startsWith('url{')) return 'URL completa do produto'
  if (q.startsWith('process_number{')) return 'Número do processo (ex: 08700.123456/2024-01)'
  if (q.startsWith('nfe_key{')) return 'Chave de acesso da NFe (44 dígitos)'
  if (q.startsWith('cte_key{')) return 'Chave de acesso do CTe'
  if (q.startsWith('car{')) return 'Código CAR do imóvel rural'
  if (q.startsWith('name{')) return 'Nome da pessoa ou empresa'
  if (q.startsWith('email{')) return 'E-mail'
  if (q.startsWith('id{')) return 'Identificador do produto'
  if (q.startsWith('polygon{')) return 'Polígono geográfico'
  return q
}

function generate() {
  const spec = JSON.parse(JSON.stringify(baseSpec))
  const tagSet = new Set()

  for (const ag of apiGroups) {
    const groupData = ag
    spec['x-tagGroups'].push({ name: groupData.name, tags: groupData.subgroups })
  }

  for (const ds of datasets) {
    if (!tagSet.has(ds.s)) {
      tagSet.add(ds.s)
      spec.tags.push({ name: ds.s, description: `${ds.s} — ${apiGroups.find(g => g.key === ds.g)?.name || ds.g}` })
    }

    const label = queryLabel(ds.q)
    const path = `/api/consultas/${ds.g}/${ds.k}`

    spec.paths[path] = {
      post: {
        tags: [ds.s],
        summary: ds.n,
        description: ds.d + `\n\n**Chave de busca:** \`${ds.q}\` — ${label}`,
        operationId: `${ds.g}_${ds.k}`,
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['q'],
                properties: {
                  q: { type: 'string', description: label, example: ds.q },
                  limit: { type: 'integer', description: 'Máximo de resultados (1-80, padrão 10)', default: 10 }
                }
              },
              example: { q: ds.q, limit: 10 }
            }
          }
        },
        responses: {
          '200': { description: 'Consulta realizada com sucesso', content: { 'application/json': { schema: { $ref: '#/components/schemas/QueryResponse' } } } },
          '400': { description: 'Requisição inválida' },
          '401': { description: 'Token ausente ou inválido' },
          '402': { description: 'Saldo insuficiente', content: { 'application/json': { schema: { $ref: '#/components/schemas/InsufficientCredits' } } } }
        }
      }
    }
  }

  const outPath = path.join(__dirname, '..', 'public', 'specs', 'consultas.json')
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2))
  console.log(`Generated spec: ${Object.keys(spec.paths).length} dataset paths, ${spec.tags.length} subgroups, ${spec['x-tagGroups'].length} API groups`)
}

generate()
