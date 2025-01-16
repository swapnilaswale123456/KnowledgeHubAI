-- Create Schema (optional since public schema already exists)
-- CREATE SCHEMA public;


-- 2. Chatbots Table
CREATE TABLE public.Chatbots (
    chatbotId SERIAL PRIMARY KEY,
    id TEXT,
    name VARCHAR(100) NOT NULL,
    uniqueUrl VARCHAR(255) UNIQUE NOT NULL,
    theme JSONB DEFAULT '{}',
    languageId INT REFERENCES public.Languages(languageId) ON DELETE SET NULL,
    initialMessage TEXT DEFAULT 'Hello! How can I assist you?',
    businessName VARCHAR(100),
    llmModelId INT REFERENCES public.LlmModels(modelId) ON DELETE SET NULL,
    totalCharacters INT DEFAULT 1000000,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- 3. Data Sources Table
CREATE TABLE public.DataSources (
    sourceId SERIAL PRIMARY KEY,
    chatbotId INT REFERENCES public.Chatbots(chatbotId) ON DELETE CASCADE,
    sourceTypeId INT REFERENCES public.DataSourceTypes(sourceTypeId) ON DELETE SET NULL,
    sourceDetails JSONB DEFAULT '{}',
    uploadedFilePath TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- 4. Customizations Table
CREATE TABLE public.Customizations (
    customizationId SERIAL PRIMARY KEY,
    chatbotId INT REFERENCES public.Chatbots(chatbotId) ON DELETE CASCADE,
    theme JSONB DEFAULT '{}',
    logoUrl TEXT,
    languageId INT REFERENCES public.Languages(languageId) ON DELETE SET NULL,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- 5. Settings Table
CREATE TABLE public.Settings (
    settingId SERIAL PRIMARY KEY,
    chatbotId INT REFERENCES public.Chatbots(chatbotId) ON DELETE CASCADE,
    allowCustomerSatisfaction BOOLEAN DEFAULT TRUE,
    shareImages BOOLEAN DEFAULT FALSE,
    unknownResponse TEXT DEFAULT 'I am not sure about that, let me find out.',
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- 6. Integration Scripts Table
CREATE TABLE public.IntegrationScripts (
    scriptId SERIAL PRIMARY KEY,
    chatbotId INT REFERENCES public.Chatbots(chatbotId) ON DELETE CASCADE,
    embedCode TEXT NOT NULL,
    integrationUrl VARCHAR(255) UNIQUE NOT NULL,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- 7. Queries Table
CREATE TABLE public.Queries (
    queryId SERIAL PRIMARY KEY,
    chatbotId INT REFERENCES public.Chatbots(chatbotId) ON DELETE CASCADE,
    queryText TEXT NOT NULL,
    responseText TEXT NOT NULL,
    confidenceScore FLOAT,
    createdAt TIMESTAMP DEFAULT NOW()
);

-- 8. LLM Models Master Table
CREATE TABLE public.LlmModels (
    modelId SERIAL PRIMARY KEY,
    modelKey VARCHAR(50) NOT NULL,
    modelName TEXT NOT NULL
);

-- 9. Data Sources Master Table
CREATE TABLE public.DataSourceTypes (
    sourceTypeId SERIAL PRIMARY KEY,
    sourceKey VARCHAR(50) NOT NULL,
    sourceName TEXT NOT NULL
);

-- 10. Languages Master Table
CREATE TABLE public.Languages (
    languageId SERIAL PRIMARY KEY,
    languageKey VARCHAR(50) NOT NULL,
    languageName TEXT NOT NULL
);

-- Insert Default Data into LLM Models Master Table
INSERT INTO public.LlmModels (modelKey, modelName) VALUES
('GPT-4', 'OpenAI GPT-4 Model'),
('GPT-3.5', 'OpenAI GPT-3.5 Model');

-- Insert Default Data into Data Sources Master Table
INSERT INTO public.DataSourceTypes (sourceKey, sourceName) VALUES
('file', 'Uploaded File'),
('website', 'Website URL'),
('youtube', 'YouTube Video'),
('notion', 'Notion Database'),
('hubspot', 'HubSpot CRM');

-- Insert Default Data into Languages Master Table
INSERT INTO public.Languages (languageKey, languageName) VALUES
('en', 'English'),
('es', 'Spanish'),
('fr', 'French');

-- Verify Schema and Data
SELECT * FROM public.LlmModels;
SELECT * FROM public.DataSourceTypes;
SELECT * FROM public.Languages;
