INSERT OR IGNORE INTO product_pricing (product, api_group, dataset_key, dataset_name, base_price, credit_cost) VALUES
-- PESSOAS | Dados Básicos
('consultas','pessoas','basic_data','Dados Básicos',0.040,12),
('consultas','pessoas','basic_data_with_configurable_recency','Dados Básicos de Recência Configurável',0.100,30),
('consultas','pessoas','historical_basic_data','Histórico de Dados Básicos',0.040,12),
-- PESSOAS | Contatos
('consultas','pessoas','emails_extended','E-mails',0.060,18),
('consultas','pessoas','related_people_emails','E-mails de Pessoas Relacionadas',0.060,18),
('consultas','pessoas','phones_extended','Telefones',0.060,18),
('consultas','pessoas','related_people_phones','Telefones de Pessoas Relacionadas',0.060,18),
('consultas','pessoas','addresses_extended','Endereços',0.060,18),
('consultas','pessoas','related_people_addresses','Endereços de Pessoas Relacionadas',0.060,18),
('consultas','pessoas','registration_data','Dados de Registro',0.140,42),
-- PESSOAS | Compliance Regulatório
('consultas','pessoas','kyc','KYC e Compliance',0.060,18),
('consultas','pessoas','first_level_relatives_kyc','KYC e Compliance dos Familiares',0.140,42),
('consultas','pessoas','online_betting_compliance','Compliance de Casas de Apostas',0.100,30),
-- PESSOAS | Comportamento
('consultas','pessoas','online_presence','Presença Online',0.060,18),
('consultas','pessoas','family_online_participation','Presença Online Familiar',0.140,42),
('consultas','pessoas','passages','Passagens pela Web',0.060,18),
('consultas','pessoas','online_betting_propensity','Propensão a Aposta Online',0.060,18),
('consultas','pessoas','digital_finance_behaviors','Comportamento Financeiro Digital',0.060,18),
-- PESSOAS | Econômicos e Financeiros
('consultas','pessoas','financial_data','Informações Financeiras',0.060,18),
('consultas','pessoas','family_financial_data','Informações Financeiras de Familiares',0.140,42),
('consultas','pessoas','social_assistance_extended','Programas de Benefícios e Assistência Social',0.060,18),
('consultas','pessoas','family_social_assistance','Assistência Social de Familiares',0.140,42),
('consultas','pessoas','industrial_property','Propriedades Industriais',0.060,18),
('consultas','pessoas','government_debtors','Devedores do Governo',0.060,18),
-- PESSOAS | Envolvimento Político
('consultas','pessoas','political_involvement','Nível de Envolvimento Político',0.060,18),
('consultas','pessoas','election_candidate_data','Candidatos Eleitorais',0.060,18),
('consultas','pessoas','family_political_history','Histórico Político Familiar',0.080,24),
('consultas','pessoas','electoral_service_providers','Prestadores de Serviços Eleitorais',0.060,18),
-- PESSOAS | Exposição Pública
('consultas','pessoas','popularity_data','Dados de Popularidade',0.060,18),
('consultas','pessoas','media_exposure_profile','Exposição e Perfil na Mídia',0.100,30),
-- PESSOAS | Presença Digital
('consultas','pessoas','online_ads','Anúncios Online',0.060,18),
('consultas','pessoas','website_data','Dados de Sites',0.060,18),
-- PESSOAS | Processos Judiciais
('consultas','pessoas','judicial_proceedings','Processos Judiciais e Administrativos',0.080,24),
('consultas','pessoas','family_judicial_proceedings','Processos Judiciais de Familiares',0.200,60),
('consultas','pessoas','judicial_distribution','Distribuição de Processos Judiciais',0.040,12),
('consultas','pessoas','family_judicial_distribution','Distribuição de Processos Judiciais Familiares',0.100,30),
-- PESSOAS | Profissionais
('consultas','pessoas','class_councils','Conselhos de Classe',0.060,18),
('consultas','pessoas','professional_data','Dados Profissionais',0.060,18),
('consultas','pessoas','education_history','Histórico Escolar e Acadêmico',0.060,18),
('consultas','pessoas','licenses_authorizations','Licenças e Autorizações',0.060,18),
('consultas','pessoas','awards_certifications','Prêmios e Certificações',0.060,18),
('consultas','pessoas','public_servants','Servidores Públicos',0.060,18),
('consultas','pessoas','professional_turnover','Turnover Profissional',0.060,18),
('consultas','pessoas','sports_exposure','Exposição Esportiva',0.080,24),
-- PESSOAS | Risco
('consultas','pessoas','financial_risk','Risco Financeiro',0.060,18),
('consultas','pessoas','family_financial_risk','Risco Financeiro Familiar',0.140,42),
('consultas','pessoas','debt_presence','Presença em Cobrança',0.060,18),
('consultas','pessoas','negative_probability','Probabilidade de Negativação',0.100,30),
-- PESSOAS | Sócio-Demográficos
('consultas','pessoas','socio_demographic','Informações Sócio-Demográficas',0.060,18),
-- PESSOAS | Veículos
('consultas','pessoas','person_vehicles','Veículos Associados à Pessoa',0.060,18),

-- EMPRESAS | Dados Básicos
('consultas','empresas','basic_data','Dados Básicos',0.030,9),
('consultas','empresas','historical_basic_data','Histórico de Dados Básicos',0.040,12),
('consultas','empresas','mcc_category','Dados de Categoria Comercial MCC',0.060,18),
-- EMPRESAS | Contatos
('consultas','empresas','registration_data','Dados de Registro',0.140,42),
('consultas','empresas','emails','E-mails',0.060,18),
('consultas','empresas','related_people_emails','E-mails de Pessoas Relacionadas',0.060,18),
('consultas','empresas','phones','Telefones',0.060,18),
('consultas','empresas','related_people_phones','Telefones de Pessoas Relacionadas',0.060,18),
('consultas','empresas','addresses','Endereços',0.060,18),
('consultas','empresas','related_people_addresses','Endereços de Pessoas Relacionadas',0.060,18),
-- EMPRESAS | Compliance Regulatório
('consultas','empresas','kyc','KYC e Compliance',0.060,18),
('consultas','empresas','partners_kyc','KYC e Compliance dos Sócios',0.100,30),
('consultas','empresas','employees_kyc','KYC e Compliance dos Funcionários',0.200,60),
('consultas','empresas','economic_group_kyc','KYC e Compliance do Grupo Econômico',0.200,60),
-- EMPRESAS | Ativos
('consultas','empresas','industrial_property','Propriedades Industriais',0.060,18),
('consultas','empresas','employees_industrial_property','Propriedades Industriais de Funcionários',0.120,36),
('consultas','empresas','partners_industrial_property','Propriedades Industriais de Sócios',0.120,36),
-- EMPRESAS | Comportamento
('consultas','empresas','digital_finance_behaviors','Comportamento Financeiro Digital',0.060,18),
-- EMPRESAS | Econômicos
('consultas','empresas','company_evolution','Evolução da Empresa',0.060,18),
('consultas','empresas','activity_indicators','Indicadores de Atividade',0.060,18),
-- EMPRESAS | Envolvimento Político
('consultas','empresas','political_involvement','Envolvimento Político',0.060,18),
('consultas','empresas','election_donations','Doações Eleitorais',0.060,18),
('consultas','empresas','partners_election_donations','Doações Eleitorais de Sócios',0.060,18),
('consultas','empresas','electoral_service_providers','Prestadores de Serviços Eleitorais',0.060,18),
-- EMPRESAS | ESG
('consultas','empresas','union_agreements','Acordos Sindicais',0.060,18),
('consultas','empresas','social_awareness','Consciência Social',0.060,18),
-- EMPRESAS | Exposição Pública
('consultas','empresas','media_exposure','Exposição e Perfil na Mídia',0.100,30),
('consultas','empresas','shareholder_influence','Influência do Quadro Societário',0.100,30),
-- EMPRESAS | Presença Digital
('consultas','empresas','online_ads','Anúncios Online',0.060,18),
('consultas','empresas','website_data','Dados de Sites',0.060,18),
('consultas','empresas','marketplaces','Marketplaces',0.060,18),
-- EMPRESAS | Processos Judiciais
('consultas','empresas','judicial_proceedings','Processos Judiciais e Administrativos',0.080,24),
('consultas','empresas','partners_judicial_proceedings','Processos Judiciais dos Sócios',0.160,48),
('consultas','empresas','judicial_distribution','Distribuição de Processos Judiciais',0.040,12),
('consultas','empresas','partners_judicial_distribution','Distribuição de Processos dos Sócios',0.100,30),
-- EMPRESAS | Relacionamentos
('consultas','empresas','relationships','Relacionamentos',0.040,12),
('consultas','empresas','economic_group_relationships','Relacionamentos do Grupo Econômico',0.060,18),
('consultas','empresas','qsa_configurable_recency','QSA de Recência Configurável',0.100,30),
-- EMPRESAS | Reputação
('consultas','empresas','reviews_reputation','Avaliações e Reputação',0.080,24),
('consultas','empresas','awards_certifications','Prêmios e Certificações',0.080,24),
-- EMPRESAS | Risco
('consultas','empresas','debt_presence','Presença em Cobrança',0.060,18),
('consultas','empresas','government_debtors','Devedores do Governo',0.060,18),
-- EMPRESAS | Setoriais
('consultas','empresas','investment_funds','Dados de Fundos de Investimento',0.060,18),
('consultas','empresas','civil_works','Dados de Obras Civis',0.060,18),
('consultas','empresas','financial_market','Mercado Financeiro',0.060,18),

-- PRODUTOS
('consultas','produtos','technical_sheet','Ficha Técnica',0.060,18),
('consultas','produtos','product_images','Imagens do Produto',0.060,18),
('consultas','produtos','related_products','Produtos Relacionados',0.060,18),
('consultas','produtos','ratings_reviews','Notas e Avaliações',0.060,18),

-- ENDEREÇOS
('consultas','enderecos','company_statistics','Estatísticas de Empresas',0.060,18),
('consultas','enderecos','municipalities','Municípios',0.040,12),
('consultas','enderecos','rural_properties_sicar','Dados de Propriedades Rurais SICAR',0.100,30),
('consultas','enderecos','legal_amazon','Amazônia Legal',0.060,18),
('consultas','enderecos','environmental_protection_areas','Áreas de Proteção Ambiental',0.060,18),
('consultas','enderecos','biomes','Biomas',0.060,18),
('consultas','enderecos','embargoed_areas_icmbio','Áreas Embargadas ICMBio',0.060,18),
('consultas','enderecos','legal_reserves_sicar','Reservas Legais SICAR',0.060,18),
('consultas','enderecos','archaeological_sites','Sítios Arqueológicos',0.060,18),
('consultas','enderecos','indigenous_lands','Terras Indígenas',0.060,18),
('consultas','enderecos','conservation_units','Unidades de Conservação',0.060,18),
('consultas','enderecos','agroecological_zoning','Zoneamento Agroecológico',0.100,30),
('consultas','enderecos','risk_areas','Endereços em Área de Risco',0.080,24),
('consultas','enderecos','crime_statistics','Estatísticas Criminais',0.060,18),

-- PROCESSOS
('consultas','processos','cade_proceedings','Processos do CADE',0.060,18),

-- VEÍCULOS
('consultas','veiculos','vehicle_plate_history','Dados Históricos de Placa',0.060,18),

-- ONDEMAND | Certidões de Empresas
('consultas','ondemand','labor_actions','Ações Trabalhistas',0.170,51),
('consultas','ondemand','disabled_persons_hiring','Contratação de Pessoas com Deficiência',0.060,18),
('consultas','ondemand','cgu_negative','CGU - Negativa',0.100,30),
('consultas','ondemand','cnj_negative','CNJ - Negativa',0.100,30),
('consultas','ondemand','state_debts_negative','Débitos Estaduais - Negativa',0.040,12),
('consultas','ondemand','labor_debts_negative','Débitos Trabalhistas - Negativa',0.100,30),
('consultas','ondemand','fgts','FGTS',0.040,12),
('consultas','ondemand','comex_habilitation','Habilitação COMEX',0.150,45),
('consultas','ondemand','ibama_embargoes','IBAMA - Embargos',0.150,45),
('consultas','ondemand','ibama_negative','IBAMA - Negativa',0.040,12),
('consultas','ondemand','ibama_regulatory','IBAMA - Regulatória',0.060,18),
('consultas','ondemand','irt','IRT',0.100,30),
('consultas','ondemand','sanitary_licenses','Licenças Sanitárias',0.140,42),
('consultas','ondemand','pgfn','PGFN',0.100,30),
('consultas','ondemand','siproquim','SIPROQUIM',0.040,12),
-- ONDEMAND | Certidões de Pessoas
('consultas','ondemand','judicial_actions_nothing','Ações Judiciais - Nada Consta',0.060,18),
('consultas','ondemand','labor_actions_person','Ações Trabalhistas (Pessoa)',0.170,51),
('consultas','ondemand','cgu_correctional_negative','CGU - Correcional Negativa',0.100,30),
('consultas','ondemand','cnj_negative_person','CNJ - Negativa (Pessoa)',0.100,30),
('consultas','ondemand','state_debts_negative_person','Débitos Estaduais - Negativa (Pessoa)',0.040,12),
('consultas','ondemand','labor_debts_negative_person','Débitos Trabalhistas - Negativa (Pessoa)',0.100,30),
('consultas','ondemand','ibama_embargoes_person','IBAMA - Embargos (Pessoa)',0.150,45),
('consultas','ondemand','ibama_negative_person','IBAMA - Negativa (Pessoa)',0.040,12),
('consultas','ondemand','ibama_regularity','IBAMA - Regularidade',0.060,18),
('consultas','ondemand','irt_person','IRT (Pessoa)',0.100,30),
('consultas','ondemand','sanitary_licenses_person','Licenças Sanitárias (Pessoa)',0.140,42),
('consultas','ondemand','pgfn_person','PGFN (Pessoa)',0.100,30),
('consultas','ondemand','civil_police_criminal','Polícia Civil - Antecedentes Criminais',0.060,18),
('consultas','ondemand','federal_police_criminal','Polícia Federal - Antecedentes Criminais',0.060,18),
('consultas','ondemand','tse_electoral_clearance','TSE - Quitação Eleitoral',0.120,36),
-- ONDEMAND | Certidões de Endereços
('consultas','ondemand','sicar_certificate','SICAR',0.100,30),
-- ONDEMAND | Consultas de Empresas
('consultas','ondemand','simples_nacional_collection','Arrecadação Simples Nacional - MEI',0.100,30),
('consultas','ondemand','cadin_debts','CADIN - Déditos',0.100,30),
('consultas','ondemand','comprot_processes','COMPROT - Processos',0.060,18),
('consultas','ondemand','digital_accounting','Escrituração Contábil Digital',0.100,30),
('consultas','ondemand','municipal_registration','Inscrição Municipal',0.060,18),
('consultas','ondemand','simples_optant','Optante Simples',0.100,30),
('consultas','ondemand','public_projects','Projetos Públicos',0.060,18),
('consultas','ondemand','federal_revenue_qsa','Receita Federal - QSA',0.060,18),
('consultas','ondemand','federal_revenue_legal_rep','Receita Federal - Representante Legal',0.040,12),
('consultas','ondemand','federal_revenue_cnpj_status','Receita Federal - Situação CNPJ',0.040,12),
('consultas','ondemand','sintegra','SINTEGRA',0.100,30),
-- ONDEMAND | Consultas de Pessoas
('consultas','ondemand','bacen_sanctions','BACEN - Sanções Administrativas',0.080,24),
('consultas','ondemand','cadin_debts_person','CADIN - Débitos (Pessoa)',0.100,30),
('consultas','ondemand','comprot_processes_person','COMPROT - Processos (Pessoa)',0.060,18),
('consultas','ondemand','detran_traffic_fines','DETRAN - Multas de Trânsito',0.060,18),
('consultas','ondemand','civil_police_bo','Polícia Civil - Boletim de Ocorrência',0.080,24),
('consultas','ondemand','rais_file_control','RAIS - Controle de Arquivos',0.060,18),
('consultas','ondemand','ir_refund','Receita Federal - Restituição do IR',0.060,18),
('consultas','ondemand','cpf_status','Receita Federal - Status do CPF',0.060,18),
('consultas','ondemand','sintegra_person','SINTEGRA (Pessoa)',0.100,30),
('consultas','ondemand','sus_card','SUS - Cartão',0.100,30),
('consultas','ondemand','tse_voting_location','TSE - Local de Votação',0.120,36),
-- ONDEMAND | Notas Fiscais
('consultas','ondemand','cte','CTe',0.060,18),
('consultas','ondemand','nfe','NFe',0.060,18),
-- ONDEMAND | Veículos
('consultas','ondemand','detran_chassis_renavam','DETRAN - Chassi e RENAVAM',0.100,30),
('consultas','ondemand','rntrc_transporters','RNTRC - Transportadores',0.100,30),

-- MARKETPLACE | Crédito Empresas
('consultas','marketplace','scr_positive_score_company','SCR / Score Positivo (Empresa)',7.01,2103),
('consultas','marketplace','restrictive_data_biro_company','Dados Restritivos / Birô de Crédito (Empresa)',13.02,3906),
('consultas','marketplace','restrictive_data_quod_company','Dados Restritivos / Quod (Empresa)',2.41,723),
('consultas','marketplace','negative_flags_quod_company','Flags Negativos / Quod (Empresa)',1.21,363),
('consultas','marketplace','credit_score_multidata_company','Score Multidados / Birô (Empresa)',13.02,3906),
('consultas','marketplace','credit_score_murabei','Score de Crédito / Murabei',0.61,183),
('consultas','marketplace','credit_score_quantum','Score de Crédito / Quantum',0.61,183),
('consultas','marketplace','credit_score_quod','Score de Crédito / Quod',2.41,723),
-- MARKETPLACE | Crédito Pessoas
('consultas','marketplace','risk_classification_b2e','Classificação de Risco / B2E',1.21,363),
('consultas','marketplace','scr_positive_score_person','SCR / Score Positivo (Pessoa)',7.01,2103),
('consultas','marketplace','restrictive_data_biro_person','Dados Restritivos / Birô (Pessoa)',13.02,3906),
('consultas','marketplace','restrictive_data_quod_person','Dados Restritivos / Quod (Pessoa)',2.41,723),
('consultas','marketplace','negative_flags_quod_person','Flags Negativos / Quod (Pessoa)',1.21,363),
('consultas','marketplace','credit_score_multidata_person','Score Multidados / Birô (Pessoa)',13.02,3906),
('consultas','marketplace','credit_score_quantum_person','Score de Crédito / Quantum (Pessoa)',0.61,183),
('consultas','marketplace','credit_score_quod_person','Score de Crédito / Quod (Pessoa)',2.41,723),
('consultas','marketplace','revolving_credit_score_quantum','Score de Crédito Rotativo / Quantum',0.61,183),
-- MARKETPLACE | Empresas
('consultas','marketplace','ownership_percentage','Percentual de Participação Societária',1.52,456),
('consultas','marketplace','ubo','UBO - Beneficiários Finais',5.01,1503),
-- MARKETPLACE | Endereços
('consultas','marketplace','fuel_prices_triad','Preços de Combustível / Triad',1.21,363),
('consultas','marketplace','property_qualification','Qualificação do Imóvel / Rede Vistorias',0.26,78),
-- MARKETPLACE | Telefones
('consultas','marketplace','device_data_telesign','Dados de Aparelho / Telesign',0.11,33),
('consultas','marketplace','portability_history_telesign','Histórico de Portabilidade / Telesign',0.23,69),
('consultas','marketplace','quality_score_blu365','Score de Qualidade / BLU365',1.21,363),
('consultas','marketplace','risk_score_telesign','Score de Risco / Telesign',1.21,363),
('consultas','marketplace','sms_delivery_blu365','Status de Entrega SMS / BLU365',0.26,78),
('consultas','marketplace','portability_status_telesign','Status de Portabilidade / Telesign',0.27,81),
('consultas','marketplace','subscriber_status_telesign','Status do Assinante / Telesign',2.51,753),
-- MARKETPLACE | IP
('consultas','marketplace','ip_risk_data','Dados de Risco do IP',0.06,18),

-- MODELAGEM | Pessoas
('consultas','modelagem','unified_modeling_x1_0_person','Dados para Modelagem x1.0 (Pessoa)',0.260,78),
('consultas','modelagem','unified_modeling_x1_5_person','Dados para Modelagem x1.5 (Pessoa)',0.400,120),
-- MODELAGEM | Empresas
('consultas','modelagem','unified_modeling_x1_0_company','Dados para Modelagem x1.0 (Empresa)',0.260,78),
('consultas','modelagem','unified_modeling_x1_5_company','Dados para Modelagem x1.5 (Empresa)',0.400,120);
