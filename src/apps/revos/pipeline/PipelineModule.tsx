import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { OpportunityToPipeline } from './components/opportunity-to-pipeline';
import { PipelineOverviewCanvas } from './components/PipelineOverviewCanvas';

export const PipelineModule: React.FC = () => {
  const [searchParams] = useSearchParams();
  const opportunityIdParam = searchParams.get('opportunityId');
  const leadIdParam = searchParams.get('leadId');

  // Isolated Parameter Route View: renders dedicated opportunity-to-pipeline bridge & workspace
  if (opportunityIdParam || leadIdParam) {
    return <OpportunityToPipeline />;
  }

  // Stage 6 Portfolio Overview & 5-Stage Kanban Canvas
  return <PipelineOverviewCanvas />;
};

export default PipelineModule;
