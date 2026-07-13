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
  tags: [],
  paths: {}
}

const groups = {
  pessoas: { tag: 'Pessoas', description: 'Dados de pessoas físicas. Utiliza CPF como chave principal.' },
  empresas: { tag: 'Empresas', description: 'Dados de empresas. Utiliza CNPJ como chave principal.' },
  enderecos: { tag: 'Endereços', description: 'Dados de endereços, municípios e áreas de proteção ambiental.' },
  veiculos: { tag: 'Veículos', description: 'Dados de veículos por placa.' },
  processos: { tag: 'Processos', description: 'Processos administrativos.' },
  produtos: { tag: 'Produtos', description: 'Dados de produtos.' },
  ondemand: { tag: 'On Demand', description: 'Certidões em tempo real e consultas online.' },
  marketplace: { tag: 'Marketplace', description: 'Score de crédito, risco, UBO e validação de telefone.' },
  modelagem: { tag: 'Modelagem', description: 'Dados para treinamento de modelos de machine learning.' }
}

const datasets = [
  // PESSOAS
  { group: 'pessoas', key: 'basic_data', name: 'Dados Básicos', desc: 'Dados cadastrais consolidados: nome, CPF, data de nascimento, filiação, situação do CPF, sexo, nacionalidade, naturalidade.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'basic_data_recent', name: 'Dados Básicos com Recência Configurável', desc: 'Dados cadastrais filtrados por janela temporal configurável.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'basic_data_history', name: 'Histórico de Dados Básicos', desc: 'Alterações cadastrais ao longo do tempo com datas de observação.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'emails', name: 'E-mails', desc: 'E-mails associados à pessoa com status de validação, datas de referência e recorrência.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'related_emails', name: 'E-mails de Pessoas Relacionadas', desc: 'E-mails de familiares, sócios e co-residentes.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'phones', name: 'Telefones', desc: 'Telefones com tipo (fixo/móvel), status, operadora, estabilidade e recorrência.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'related_phones', name: 'Telefones de Pessoas Relacionadas', desc: 'Telefones de pessoas relacionadas.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'addresses', name: 'Endereços', desc: 'Endereços com tipo, completude, datas de referência e estabilidade.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'related_addresses', name: 'Endereços de Pessoas Relacionadas', desc: 'Endereços de pessoas relacionadas.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'registration_data', name: 'Dados de Registro', desc: 'Identificação + contatos consolidados para validação cadastral.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'kyc_compliance', name: 'KYC e Compliance', desc: 'Indicadores de PEP, listas restritivas, impedimentos públicos e score de risco regulatório.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'kyc_compliance_family', name: 'KYC e Compliance Familiar', desc: 'Dados de compliance de familiares de primeiro nível.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'gambling_compliance', name: 'Compliance de Apostas', desc: 'Participação societária em empresas de apostas online.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'online_presence', name: 'Presença Online', desc: 'Intensidade de presença digital em bandas A-H nos períodos de 30/90/180/365 dias.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'family_online_presence', name: 'Presença Online Familiar', desc: 'Atividade digital agregada do núcleo familiar.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'web_passages', name: 'Passagens pela Web', desc: 'Ocorrências na web associadas ao CPF, qualificadas como positivas, negativas ou neutras.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'online_betting_propensity', name: 'Propensão a Apostas Online', desc: 'Score de propensão a apostas online em banda A-H.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'digital_financial_behavior', name: 'Comportamento Financeiro Digital', desc: 'Classificação A-H de maturidade financeira digital.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'financial_info', name: 'Informações Financeiras', desc: 'Indicadores financeiros: renda estimada, situação empregatícia, vínculos previdenciários.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'family_financial_info', name: 'Informações Financeiras Familiares', desc: 'Indicadores financeiros do núcleo familiar.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'social_benefits', name: 'Benefícios Sociais', desc: 'Participação em programas de transferência de renda federais, estaduais e municipais.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'family_social_benefits', name: 'Benefícios Sociais Familiares', desc: 'Benefícios sociais de familiares.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'industrial_property', name: 'Propriedades Industriais', desc: 'Marcas e patentes registradas em bases oficiais.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'government_debtors', name: 'Devedores do Governo', desc: 'Registros de dívidas ativas com órgãos públicos.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'political_involvement_level', name: 'Nível de Envolvimento Político', desc: 'Indicador consolidado de envolvimento político: participação eleitoral, doações, cargos públicos.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'electoral_candidates', name: 'Candidatos Eleitorais', desc: 'Histórico de candidaturas: cargo, partido, coligação, ano, resultado.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'electoral_donations', name: 'Doações Eleitorais', desc: 'Doações eleitorais realizadas ou recebidas.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'family_political_history', name: 'Histórico Político Familiar', desc: 'Envolvimento político de membros da família.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'electoral_service_providers', name: 'Prestadores de Serviços Eleitorais', desc: 'Vínculos com campanhas, partidos ou estruturas políticas.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'popularity_data', name: 'Dados de Popularidade', desc: 'Indicador de influência pública consolidado: exposição política, judicial, econômica, midiática.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'media_exposure', name: 'Exposição na Mídia', desc: 'Frequência, visibilidade e sentimento em conteúdo jornalístico.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'online_ads', name: 'Anúncios Online', desc: 'Perfis de anunciante em portais e marketplaces.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'website_data', name: 'Dados de Sites', desc: 'Sites associados ao indivíduo: domínios, tecnologias.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'processes', name: 'Processos Judiciais', desc: 'Processos judiciais e administrativos: cível, trabalhista, criminal, administrativo.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'family_processes', name: 'Processos Judiciais Familiares', desc: 'Processos de familiares de primeiro grau.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'process_distribution', name: 'Distribuição de Processos', desc: 'Visão agregada de processos: distribuição por tipo, instância, status.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'family_process_distribution', name: 'Distribuição de Processos Familiares', desc: 'Indicadores agregados de processos de familiares.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'professional_data', name: 'Dados Profissionais', desc: 'Ocupação, cargos, áreas de atuação, empregadores.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'professional_turnover', name: 'Turnover Profissional', desc: 'Indicadores de mudanças profissionais: frequência, padrões temporais.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'academic_history', name: 'Histórico Acadêmico', desc: 'Cursos técnicos, graduação, pós-graduação, MBA. Instituição, período, status.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'awards_certifications', name: 'Prêmios e Certificações', desc: 'Reconhecimentos públicos e certificações profissionais.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'licenses_authorizations', name: 'Licenças e Autorizações', desc: 'Permissões profissionais: tipo, órgão emissor, validade.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'professional_councils', name: 'Conselhos de Classe', desc: 'Inscrição em conselhos profissionais (CRM, OAB, CREA, CRC).', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'public_servants', name: 'Servidores Públicos', desc: 'Vínculos com administração pública: cargos, entidades, lotação.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'sports_exposure', name: 'Exposição Esportiva', desc: 'Participação esportiva: competições, rankings, clubes.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'financial_risk', name: 'Risco Financeiro', desc: 'Inadimplência, dívidas ativas, scores de risco e classificações.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'family_financial_risk', name: 'Risco Financeiro Familiar', desc: 'Risco financeiro de familiares de primeiro nível.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'collection_presence', name: 'Presença em Cobrança', desc: 'Ocorrências em processos de cobrança: recorrência, origens, períodos.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'default_probability', name: 'Probabilidade de Negativação', desc: 'Score preditivo de negativação futura.', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'sociodemographic_info', name: 'Informações Sócio-Demográficas', desc: 'Perfil populacional da região: renda, escolaridade, composição familiar (IBGE).', query: 'doc{12345678909}' },
  { group: 'pessoas', key: 'vehicles', name: 'Veículos Associados', desc: 'Veículos relacionados à pessoa por anúncios e bases públicas.', query: 'doc{12345678909}' },
  // EMPRESAS
  { group: 'empresas', key: 'company_basic_data', name: 'Dados Básicos', desc: 'Dados cadastrais consolidados: razão social, CNPJ, data de abertura, regime tributário, CNAE.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_basic_data_history', name: 'Histórico de Dados Básicos', desc: 'Alterações cadastrais ao longo do tempo.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'mcc_data', name: 'Categoria Comercial MCC', desc: 'Código MCC para classificação de serviços financeiros.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_registration_data', name: 'Dados de Registro', desc: 'Identificação + contatos consolidados.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_emails', name: 'E-mails', desc: 'E-mails associados à empresa.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_related_emails', name: 'E-mails de Relacionados', desc: 'E-mails de pessoas relacionadas à empresa.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_phones', name: 'Telefones', desc: 'Telefones da empresa.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_related_phones', name: 'Telefones de Relacionados', desc: 'Telefones de pessoas relacionadas.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_addresses', name: 'Endereços', desc: 'Endereços da empresa.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_related_addresses', name: 'Endereços de Relacionados', desc: 'Endereços de pessoas relacionadas.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_kyc_compliance', name: 'KYC e Compliance', desc: 'PEP, sanções, restrições nacionais e internacionais.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'partner_kyc_compliance', name: 'KYC dos Sócios', desc: 'KYC e compliance dos sócios.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'employee_kyc_compliance', name: 'KYC dos Funcionários', desc: 'KYC e compliance dos funcionários.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'economic_group_kyc_compliance', name: 'KYC do Grupo Econômico', desc: 'KYC de todo o grupo econômico.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_industrial_property', name: 'Propriedades Industriais', desc: 'Marcas e patentes da empresa.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'employee_industrial_property', name: 'Propriedades Industriais de Funcionários', desc: 'Propriedade intelectual de funcionários.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'partner_industrial_property', name: 'Propriedades Industriais de Sócios', desc: 'Propriedade intelectual de sócios.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_evolution', name: 'Evolução da Empresa', desc: 'Capital social, funcionários e sócios ao longo do tempo.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'activity_indicators', name: 'Indicadores de Atividade', desc: 'Faixa de receita, funcionários, presença digital.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_political_involvement', name: 'Envolvimento Político', desc: 'Score de participação política do quadro societário.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_electoral_donations', name: 'Doações Eleitorais', desc: 'Doações eleitorais da empresa.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'partner_electoral_donations', name: 'Doações Eleitorais de Sócios', desc: 'Doações eleitorais realizadas por sócios.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'union_agreements', name: 'Acordos Sindicais', desc: 'Convenções coletivas de trabalho.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'social_awareness', name: 'Consciência Social', desc: 'Acessibilidade, diversidade, gap salarial.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_media_exposure', name: 'Exposição na Mídia', desc: 'Presença em conteúdo jornalístico com análise de sentimento.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'shareholder_influence', name: 'Influência do Quadro Societário', desc: 'Nível de influência inferido do quadro de sócios.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_online_ads', name: 'Anúncios Online', desc: 'Perfis de anunciante em marketplaces.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_website_data', name: 'Dados de Sites', desc: 'Sites, domínios, tecnologias e certificados de segurança.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'marketplaces', name: 'Marketplaces', desc: 'Presença em e-commerce: indicadores agregados.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_processes', name: 'Processos Judiciais', desc: 'Processos judiciais e administrativos da empresa.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'partner_processes', name: 'Processos dos Sócios', desc: 'Processos judiciais dos sócios.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_process_distribution', name: 'Distribuição de Processos', desc: 'Dados agregados de processos da empresa.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'partner_process_distribution', name: 'Distribuição de Processos dos Sócios', desc: 'Dados agregados de processos dos sócios.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_relationships', name: 'Relacionamentos', desc: 'Entidades com vínculo com a empresa.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'economic_group_relationships', name: 'Relacionamentos do Grupo Econômico', desc: 'Entidades do mesmo grupo econômico.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'qsa_recent', name: 'QSA com Recência Configurável', desc: 'Estrutura societária em tempo real.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'reviews_reputation', name: 'Avaliações e Reputação', desc: 'Reputação em múltiplas plataformas.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_awards_certifications', name: 'Prêmios e Certificações', desc: 'Prêmios e certificações obtidas.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_collection_presence', name: 'Presença em Cobrança', desc: 'Passagem por processos de cobrança.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'company_government_debtors', name: 'Devedores do Governo', desc: 'Registro em dívida ativa da União e FGTS.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'investment_funds_data', name: 'Fundos de Investimento', desc: 'Empresas registradas na CVM: dados cadastrais e movimentações.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'civil_works_data', name: 'Obras Civis', desc: 'Obras civis registradas no CNO.', query: 'doc{11222333000181}' },
  { group: 'empresas', key: 'financial_market_data', name: 'Mercado Financeiro', desc: 'Balanço patrimonial, estrutura acionária de empresas de capital aberto.', query: 'doc{11222333000181}' },
  // ENDEREÇOS
  { group: 'enderecos', key: 'company_statistics', name: 'Estatísticas de Empresas', desc: 'Perfil econômico da região.', query: 'cep{01310100}' },
  { group: 'enderecos', key: 'municipalities', name: 'Municípios', desc: 'Dados de municípios.', query: 'polygon{POLYGON}' },
  { group: 'enderecos', key: 'sicar_properties', name: 'Propriedades Rurais SICAR', desc: 'Propriedades rurais do CAR.', query: 'car{CAR_ID}' },
  { group: 'enderecos', key: 'amazon_legal', name: 'Amazônia Legal', desc: 'Indicador de Amazônia Legal.', query: 'cep{01310100}' },
  { group: 'enderecos', key: 'environmental_protection_areas', name: 'Áreas de Proteção Ambiental', desc: 'Presença e proximidade de APA.', query: 'cep{01310100}' },
  { group: 'enderecos', key: 'biomes', name: 'Biomas', desc: 'Informação de bioma.', query: 'cep{01310100}' },
  { group: 'enderecos', key: 'icmbio_embargoed_areas', name: 'Áreas Embargadas ICMBio', desc: 'Áreas sob embargo ambiental.', query: 'car{CAR_ID}' },
  { group: 'enderecos', key: 'sicar_legal_reserves', name: 'Reservas Legais SICAR', desc: 'Proximidade de reservas legais.', query: 'car{CAR_ID}' },
  { group: 'enderecos', key: 'archaeological_sites', name: 'Sítios Arqueológicos', desc: 'Existência de sítios arqueológicos.', query: 'cep{01310100}' },
  { group: 'enderecos', key: 'indigenous_lands', name: 'Terras Indígenas', desc: 'Proximidade de terras indígenas.', query: 'cep{01310100}' },
  { group: 'enderecos', key: 'conservation_units', name: 'Unidades de Conservação', desc: 'Presença de unidades de conservação.', query: 'cep{01310100}' },
  { group: 'enderecos', key: 'agroecological_zoning', name: 'Zoneamento Agroecológico', desc: 'Aptidão agrícola e restrições.', query: 'cep{01310100}' },
  { group: 'enderecos', key: 'address_risk_area', name: 'Áreas de Risco', desc: 'Proximidade de áreas de risco (IBGE).', query: 'cep{01310100}' },
  { group: 'enderecos', key: 'crime_statistics', name: 'Estatísticas Criminais', desc: 'Incidência criminal municipal (MG, SP, RJ).', query: 'cep{01310100}' },
  // VEÍCULOS
  { group: 'veiculos', key: 'vehicle_plate_history', name: 'Histórico de Placa', desc: 'Dados cadastrais e históricos do veículo.', query: 'plate{ABC1234}' },
  // PROCESSOS
  { group: 'processos', key: 'cade_processes', name: 'Processos do CADE', desc: 'Processos do Conselho Administrativo de Defesa Econômica.', query: 'process_number{NR}' },
  // PRODUTOS
  { group: 'produtos', key: 'product_specifications', name: 'Ficha Técnica', desc: 'Características técnicas e descritivas do produto.', query: 'url{URL}' },
  { group: 'produtos', key: 'product_images', name: 'Imagens do Produto', desc: 'Imagens atuais e históricas.', query: 'url{URL}' },
  { group: 'produtos', key: 'current_price', name: 'Preço Atual', desc: 'Preços mais recentes em diferentes fontes.', query: 'url{URL}' },
  { group: 'produtos', key: 'price_history', name: 'Histórico de Preços', desc: 'Evolução de preços ao longo do tempo.', query: 'url{URL}' },
  { group: 'produtos', key: 'related_products', name: 'Produtos Relacionados', desc: 'Produtos associados.', query: 'url{URL}' },
  { group: 'produtos', key: 'product_ratings', name: 'Notas e Avaliações', desc: 'Avaliações de diferentes lojas e marketplaces.', query: 'url{URL}' },
  // ON-DEMAND
  { group: 'ondemand', key: 'labor_claims_certificate', name: 'Ações Trabalhistas', desc: 'Certidão de ações trabalhistas (empresa).', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'disabled_persons_hiring', name: 'Contratação de PCD', desc: 'Compliance legal para empresas >100 funcionários.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'cgu_negative_certificate', name: 'CGU Negativa', desc: 'Sanções e restrições: CEIS, CNEP, CEPIM.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'cnj_negative_certificate', name: 'CNJ Negativa', desc: 'Condenações cíveis por improbidade.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'state_debts_negative', name: 'Débitos Estaduais Negativa', desc: 'Ausência de débitos fiscais estaduais.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'labor_debts_negative', name: 'Débitos Trabalhistas Negativa', desc: 'Ausência de débitos trabalhistas.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'fgts_certificate', name: 'FGTS', desc: 'Certidão de regularidade do FGTS.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'comex_habilitation', name: 'Habilitação COMEX', desc: 'Status de habilitação para operações de comércio exterior.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'ibama_embargoes_certificate', name: 'IBAMA Embargos', desc: 'Embargos ambientais IBAMA.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'ibama_negative_certificate', name: 'IBAMA Negativa', desc: 'Certidão de nada consta ambiental.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'ibama_regulatory', name: 'IBAMA Regulatória', desc: 'Obrigações e enquadramentos ambientais.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'irt_certificate', name: 'IRT', desc: 'Certidão de débito fiscal de propriedade rural.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'health_licenses', name: 'Licenças Sanitárias', desc: 'Licenças sanitárias (SP).', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'pgfn_certificate', name: 'PGFN', desc: 'Certidão de débitos fiscais federais e Dívida Ativa.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'siproquim', name: 'SIPROQUIM', desc: 'Habilitação para produtos químicos controlados.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'sicar_certificate', name: 'SICAR', desc: 'Certidão do CAR.', query: 'car{CAR_ID}' },
  { group: 'ondemand', key: 'federal_court_lawsuit_certificate', name: 'Ações Judiciais Nada Consta', desc: 'Certidão de nada consta de tribunais regionais federais.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_labor_claims', name: 'Ações Trabalhistas (Pessoa)', desc: 'Certidão de ações trabalhistas para pessoa física.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'cgu_correctional_negative', name: 'CGU Correcional Negativa', desc: 'Sanções em ePAD/CGU-PJ.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_cnj_negative', name: 'CNJ Negativa (Pessoa)', desc: 'Condenações por improbidade.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_state_debts_negative', name: 'Débitos Estaduais Negativa (Pessoa)', desc: 'Ausência de débitos estaduais.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_labor_debts_negative', name: 'Débitos Trabalhistas Negativa (Pessoa)', desc: 'Ausência de débitos trabalhistas.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_ibama_embargoes', name: 'IBAMA Embargos (Pessoa)', desc: 'Pessoas embargadas pelo IBAMA.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_ibama_negative', name: 'IBAMA Negativa (Pessoa)', desc: 'Nada consta ambiental.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_ibama_regularity', name: 'IBAMA Regularidade', desc: 'Certidão de regularidade IBAMA.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_irt', name: 'IRT (Pessoa)', desc: 'Débito fiscal rural.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_health_licenses', name: 'Licenças Sanitárias (Pessoa)', desc: 'Licenças sanitárias.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_pgfn', name: 'PGFN (Pessoa)', desc: 'Débitos fiscais federais.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'civil_police_criminal_record', name: 'Antecedentes Criminais (Polícia Civil)', desc: 'Certidão de antecedentes criminais estadual.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'federal_police_criminal_record', name: 'Antecedentes Criminais (Polícia Federal)', desc: 'Certidão de antecedentes criminais federal.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'tse_electoral_certificate', name: 'TSE Quitação Eleitoral', desc: 'Certidão de quitação eleitoral.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'mei_das_collection', name: 'Arrecadação Simples Nacional MEI', desc: 'Histórico de pagamento DAS.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'cadin_debts', name: 'CADIN Débitos', desc: 'Registro em CADIN municipal/estadual.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'comprot_processes', name: 'COMPROT Processos', desc: 'Processos no Ministério da Fazenda.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'municipal_registration', name: 'Inscrição Municipal', desc: 'Dados de inscrição municipal.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'simples_nacional_optant', name: 'Optante Simples Nacional', desc: 'Status de optante pelo Simples.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'public_projects', name: 'Projetos Públicos', desc: 'Projetos com financiamento público.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'qsa_receita', name: 'QSA Receita Federal', desc: 'Quadro societário da RFB.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'legal_representative', name: 'Representante Legal RFB', desc: 'Representantes legais na RFB.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'cnpj_situation', name: 'Situação CNPJ', desc: 'Situação cadastral do CNPJ.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'sintegra', name: 'SINTEGRA', desc: 'Inscrição estadual SINTEGRA.', query: 'doc{11222333000181}' },
  { group: 'ondemand', key: 'bacen_sanctions', name: 'BACEN Sanções', desc: 'Sanções administrativas do Banco Central.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_cadin_debts', name: 'CADIN Débitos (Pessoa)', desc: 'Registro em CADIN.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_comprot_processes', name: 'COMPROT Processos (Pessoa)', desc: 'Processos no Ministério da Fazenda.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'detran_traffic_fines', name: 'DETRAN Multas', desc: 'Infrações de trânsito.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'cpf_status', name: 'Status do CPF', desc: 'Situação cadastral do CPF na Receita Federal.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'person_sintegra', name: 'SINTEGRA (Pessoa)', desc: 'Inscrição estadual.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'sus_card', name: 'SUS Cartão', desc: 'Número do cartão SUS.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'tse_voting_location', name: 'TSE Local de Votação', desc: 'Local de votação e situação eleitoral.', query: 'doc{12345678909}' },
  { group: 'ondemand', key: 'cte', name: 'CTe', desc: 'Conhecimento de Transporte Eletrônico.', query: 'cte_key{CHAVE}' },
  { group: 'ondemand', key: 'nfe', name: 'NFe', desc: 'Nota Fiscal Eletrônica.', query: 'nfe_key{CHAVE}' },
  { group: 'ondemand', key: 'detran_chassis_renavam', name: 'DETRAN Chassi e Renavam', desc: 'Dados cadastrais do veículo.', query: 'plate{ABC1234}' },
  { group: 'ondemand', key: 'rntrc_transporters', name: 'RNTRC Transportadores', desc: 'Registro nacional de transportadores.', query: 'plate{ABC1234}' },
  // MARKETPLACE
  { group: 'marketplace', key: 'scr_positive_score', name: 'SCR Score Positivo', desc: 'Sistema de Informações de Crédito do BCB.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'bureau_restrictive_data', name: 'Dados Restritivos Birô', desc: 'Cadastral + registros negativos + score.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'quod_restrictive_data', name: 'Dados Restritivos Quod', desc: 'Sinais de risco e negativação potencial.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'quod_negative_flags', name: 'Flags Negativos Quod', desc: 'Marcadores negativos de crédito.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'multidata_credit_score', name: 'Score Multidados Birô', desc: 'Score consolidado de múltiplas fontes.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'murabei_credit_score', name: 'Score Murabei', desc: 'Score 0-1000 baseado em ML.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'quantum_credit_score', name: 'Score Quantum', desc: 'Score 0-999 Quantum.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'quod_credit_score', name: 'Score Quod', desc: 'Score 300-1000 de comportamento creditício.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'b2e_risk_classification', name: 'Classificação de Risco B2E', desc: 'Classificação de risco de fraude.', query: 'doc{12345678909}' },
  { group: 'marketplace', key: 'person_scr_positive_score', name: 'SCR Score Positivo (Pessoa)', desc: 'SCR do BCB para pessoa física.', query: 'doc{12345678909}' },
  { group: 'marketplace', key: 'person_bureau_restrictive', name: 'Dados Restritivos Birô (Pessoa)', desc: 'Restritivos + score de mercado.', query: 'doc{12345678909}' },
  { group: 'marketplace', key: 'person_quod_restrictive', name: 'Dados Restritivos Quod (Pessoa)', desc: 'Risco de crédito Quod.', query: 'doc{12345678909}' },
  { group: 'marketplace', key: 'person_quod_negative_flags', name: 'Flags Negativos Quod (Pessoa)', desc: 'Eventos negativos de crédito.', query: 'doc{12345678909}' },
  { group: 'marketplace', key: 'person_multidata_score', name: 'Score Multidados (Pessoa)', desc: 'Score consolidado.', query: 'doc{12345678909}' },
  { group: 'marketplace', key: 'person_quantum_score', name: 'Score Quantum (Pessoa)', desc: 'Score de probabilidade de inadimplência.', query: 'doc{12345678909}' },
  { group: 'marketplace', key: 'person_quod_score', name: 'Score Quod (Pessoa)', desc: 'Score + indicadores de capacidade.', query: 'doc{12345678909}' },
  { group: 'marketplace', key: 'quantum_revolving_score', name: 'Score Rotativo Quantum', desc: 'Score de risco para crédito rotativo.', query: 'doc{12345678909}' },
  { group: 'marketplace', key: 'shareholding_percentage', name: 'Percentual Societário', desc: 'Participação exata por sócio.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'ubo_final_beneficiaries', name: 'UBO Beneficiários Finais', desc: 'Beneficiários finais com participação >20%.', query: 'doc{11222333000181}' },
  { group: 'marketplace', key: 'fuel_prices_region', name: 'Preços de Combustível Triad', desc: 'Preços de combustível na região.', query: 'latlong{-23.5505,-46.6333}' },
  { group: 'marketplace', key: 'property_qualification', name: 'Qualificação do Imóvel', desc: 'Atributos estruturais e cadastrais.', query: 'cep{01310100}' },
  { group: 'marketplace', key: 'device_cadaster_telesign', name: 'Dados de Aparelho Telesign', desc: 'Tipo de dispositivo, operadora, dados cadastrais.', query: 'phone{5511999999999}' },
  { group: 'marketplace', key: 'portability_history_telesign', name: 'Histórico de Portabilidade Telesign', desc: 'Histórico de portabilidade do número.', query: 'phone{5511999999999}' },
  { group: 'marketplace', key: 'quality_score_blu365', name: 'Score de Qualidade BLU365', desc: 'Probabilidade de entrega de SMS.', query: 'phone{5511999999999}' },
  { group: 'marketplace', key: 'risk_score_telesign', name: 'Score de Risco Telesign', desc: 'Avaliação de risco do telefone.', query: 'phone{5511999999999}' },
  { group: 'marketplace', key: 'sms_delivery_status_blu365', name: 'Status de Entrega SMS BLU365', desc: 'Status da última tentativa de SMS.', query: 'phone{5511999999999}' },
  { group: 'marketplace', key: 'portability_status_telesign', name: 'Status de Portabilidade Telesign', desc: 'Operadora atual do número.', query: 'phone{5511999999999}' },
  { group: 'marketplace', key: 'subscriber_status_telesign', name: 'Status do Assinante Telesign', desc: 'Tipo de plano, status da linha, tempo de posse.', query: 'phone{5511999999999}' },
  { group: 'marketplace', key: 'ip_risk_data', name: 'Dados de Risco do IP', desc: 'Geolocalização, ISP, proxy, VPN, abuso.', query: 'ip{200.150.100.50}' },
  // MODELAGEM
  { group: 'modelagem', key: 'unified_modeling_x1_0_person', name: 'Modelagem x1.0 (Pessoa)', desc: 'Atributos essenciais para modelagem.', query: 'doc{12345678909}' },
  { group: 'modelagem', key: 'unified_modeling_x1_5_person', name: 'Modelagem x1.5 (Pessoa)', desc: 'Atributos expandidos para maior poder explicativo.', query: 'doc{12345678909}' },
  { group: 'modelagem', key: 'unified_modeling_x1_0_company', name: 'Modelagem x1.0 (Empresa)', desc: 'Variáveis consolidadas para modelagem de empresas.', query: 'doc{11222333000181}' },
  { group: 'modelagem', key: 'unified_modeling_x1_5_company', name: 'Modelagem x1.5 (Empresa)', desc: 'Dataset expandido com atributos econômicos e financeiros.', query: 'doc{11222333000181}' },
]

function makePath(group, ds) {
  const g = groups[group]
  const path = `/api/consultas/${group}/${ds.key}`
  const responses = {
    '200': { description: 'Consulta realizada com sucesso', content: { 'application/json': { schema: { $ref: '#/components/schemas/QueryResponse' } } } },
    '400': { description: 'Requisição inválida' },
    '401': { description: 'Token ausente ou inválido' },
    '402': { description: 'Saldo insuficiente', content: { 'application/json': { schema: { $ref: '#/components/schemas/InsufficientCredits' } } } }
  }

  return {
    [path]: {
      post: {
        tags: [g.tag],
        summary: ds.name,
        description: ds.desc + `\n\n**Chave de busca:** \`${ds.query}\``,
        operationId: `${group}_${ds.key}`,
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Chave de busca', example: ds.query }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['q'],
                properties: {
                  q: { type: 'string', description: 'Chave de busca. Formatos: doc{CPF}, doc{CNPJ}, plate{PLACA}, cep{CEP}, phone{TELEFONE}, name{NOME}, email{EMAIL}, url{URL}, ip{IP}, latlong{LAT,LNG}, process_number{NR}, nfe_key{CHAVE}, cte_key{CHAVE}, car{CAR_ID}', example: ds.query },
                  limit: { type: 'integer', description: 'Máximo de resultados (1-80, padrão 10)', default: 10 }
                }
              },
              example: { q: ds.query, limit: 10 }
            }
          }
        },
        responses
      }
    }
  }
}

function generate() {
  const usedTags = new Set()
  const spec = JSON.parse(JSON.stringify(baseSpec))

  for (const ds of datasets) {
    if (!usedTags.has(ds.group)) {
      usedTags.add(ds.group)
      const g = groups[ds.group]
      spec.tags.push({ name: g.tag, description: g.description })
    }
    Object.assign(spec.paths, makePath(ds.group, ds))
  }

  const outPath = path.join(__dirname, '..', 'public', 'specs', 'consultas.json')
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2))
  console.log(`Generated spec with ${Object.keys(spec.paths).length} dataset paths`)
  console.log(`Written to ${outPath}`)
}

generate()
