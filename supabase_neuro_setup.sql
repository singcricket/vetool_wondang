-- 1. Create neuro_charts table
CREATE TABLE public.neuro_charts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hos_id UUID NOT NULL REFERENCES public.hospitals(hos_id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
    chart_date DATE NOT NULL,
    results JSONB DEFAULT '{}'::jsonb,
    localisations JSONB DEFAULT '{}'::jsonb,
    summary TEXT,
    evaluator_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Setup RLS (Row Level Security) - Assuming typical setup based on hospital_id
ALTER TABLE public.neuro_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users within the same hospital" ON public.neuro_charts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.hos_id = neuro_charts.hos_id 
            AND users.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert access for all users within the same hospital" ON public.neuro_charts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.hos_id = neuro_charts.hos_id 
            AND users.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update access for all users within the same hospital" ON public.neuro_charts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.hos_id = neuro_charts.hos_id 
            AND users.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete access for all users within the same hospital" ON public.neuro_charts
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.hos_id = neuro_charts.hos_id 
            AND users.user_id = auth.uid()
        )
    );

-- 3. Create updated_at trigger
-- (If trigger_set_updated_at function already exists, you can skip the function creation)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON public.neuro_charts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

