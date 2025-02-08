import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowRight, ArrowLeft, Wand2, Code, Play, LayoutGrid, Search, Settings2, Plus, GripVertical, RotateCcw, Save } from "lucide-react";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { useSortable } from "@dnd-kit/sortable";
import { DndContext, closestCenter, DragEndEvent, useSensors, useSensor, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Switch } from "~/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";

// Sample workflow template
const WORKFLOW_TEMPLATE = {
  trigger: { type: "user_message", conditions: ["contains_order_inquiry"] },
  actions: [
    { id: '1', type: "check_order_status", api: "shopify", params: { order_id: "{{extracted_order_id}}" } },
    { id: '2', type: "format_response", template: "order_status_template" },
    { id: '3', type: "send_message", content: "{{formatted_response}}" }
  ]
};

const API_SUGGESTIONS = [
  { name: "Shopify", icon: "🛍️", status: "connected", actions: ["check_order", "get_products"] },
  { name: "Stripe", icon: "💳", status: "suggested", actions: ["process_refund", "check_payment"] },
  { name: "Zendesk", icon: "🎯", status: "suggested", actions: ["create_ticket", "update_status"] }
];

const WORKFLOW_CATEGORIES = ['All', 'E-commerce', 'Support', 'Sales', 'HR'] as const;

const SUGGESTED_WORKFLOWS = [
  {
    id: 'order_tracking',
    name: 'Order Status Checker',
    description: 'Automatically check and respond to order status inquiries',
    skillMatch: 95,
    category: 'E-commerce',
    apis: ['Shopify', 'Zendesk'],
    triggers: ['Message contains order number', 'Customer asks about order'],
    popularity: 'High',
    template: {
      trigger: { type: 'message_received', conditions: ['contains_order_number'] },
      steps: [
        { type: 'extract_order_id', input: '{{message}}' },
        { type: 'check_order_status', api: 'shopify' },
        { type: 'format_response', template: 'order_status' },
        { type: 'send_message', output: '{{formatted_response}}' }
      ]
    }
  },
  {
    id: 'refund_request',
    name: 'Refund Request Handler',
    description: 'Process refund requests with approval workflow',
    skillMatch: 85,
    category: 'E-commerce',
    apis: ['Stripe', 'Shopify'],
    triggers: ['Refund request', 'Return inquiry'],
    popularity: 'Medium',
    template: {/* ... */}
  },
  {
    id: 'ticket_escalation',
    name: 'Support Ticket Escalation',
    description: 'Automatically escalate urgent support tickets',
    skillMatch: 78,
    category: 'Support',
    apis: ['Zendesk', 'Slack'],
    triggers: ['Urgent keyword detected', 'Customer satisfaction below threshold'],
    popularity: 'High',
    template: {/* ... */}
  },
  {
    id: 'lead_qualification',
    name: 'Lead Qualification',
    description: 'Qualify and route sales leads',
    skillMatch: 82,
    category: 'Sales',
    apis: ['HubSpot', 'Salesforce'],
    triggers: ['New lead form submission', 'Sales inquiry detected'],
    popularity: 'Medium',
    template: {/* ... */}
  }
];

type ApiMappings = {
  [key: string]: {
    fields: {
      [key: string]: {
        type: string;
        required: boolean;
        label: string;
        placeholder?: string;
        options?: string[];
      };
    };
  };
};

const API_MAPPINGS: ApiMappings = {
  shopify: {
    fields: {
      order_id: { type: 'string', required: true, label: 'Order ID', placeholder: 'e.g., #1234' },
      store_id: { type: 'string', required: false, label: 'Store ID', placeholder: 'Optional' },
      notification: { type: 'boolean', required: false, label: 'Send Notification' },
      status: { type: 'select', required: true, label: 'Order Status', 
        options: ['processing', 'shipped', 'delivered', 'cancelled'] },
      priority: { type: 'radio', required: true, label: 'Priority',
        options: ['low', 'medium', 'high'] },
      tags: { type: 'multiselect', required: false, label: 'Tags',
        options: ['urgent', 'vip', 'backorder', 'international'] }
    }
  },
  zendesk: {
    fields: {
      ticket_id: { type: 'string', required: true, label: 'Ticket ID' },
      priority: { type: 'select', required: true, label: 'Priority', options: ['low', 'medium', 'high'] }
    }
  }
};

// Add these new workflow block types
const WORKFLOW_BLOCKS = {
  triggers: [
    { id: 'message_received', type: 'trigger', name: 'Message Received', icon: '💬' },
    { id: 'keyword_detected', type: 'trigger', name: 'Keyword Detected', icon: '🔍' },
    { id: 'schedule', type: 'trigger', name: 'Schedule', icon: '⏰' }
  ],
  conditions: [
    { id: 'check_intent', type: 'condition', name: 'Check Intent', icon: '🎯' },
    { id: 'sentiment_check', type: 'condition', name: 'Sentiment Check', icon: '😊' },
    { id: 'data_validation', type: 'condition', name: 'Data Validation', icon: '✅' }
  ],
  actions: [
    { id: 'api_call', type: 'action', name: 'API Call', icon: '🔌' },
    { id: 'send_message', type: 'action', name: 'Send Message', icon: '📤' },
    { id: 'notification', type: 'action', name: 'Notification', icon: '🔔' }
  ]
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({
    workflowId: params.id,
    currentStep: 3,
    totalSteps: 4
  });
};

export default function WorkflowGeneration() {
  const { currentStep, totalSteps } = useLoaderData<typeof loader>();
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const [selectedWorkflow, setSelectedWorkflow] = useState(SUGGESTED_WORKFLOWS[0]);
  const [viewMode, setViewMode] = useState<'suggestions' | 'editor'>('suggestions');
  const [selectedCategory, setSelectedCategory] = useState<typeof WORKFLOW_CATEGORIES[number]>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewMode, setPreviewMode] = useState<'flow' | 'json'>('flow');
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState(WORKFLOW_TEMPLATE.actions);
  const [stepParams, setStepParams] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleBack = () => navigate("../skill-selection");
  const handleNext = () => navigate("../connect-apis");

  const handleGenerateWorkflow = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => setIsGenerating(false), 2000);
  };

  const filteredWorkflows = SUGGESTED_WORKFLOWS.filter(workflow => {
    const matchesCategory = selectedCategory === 'All' || workflow.category === selectedCategory;
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setWorkflowSteps((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const renderWorkflowSteps = () => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={workflowSteps.map(step => step.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 relative">
          {workflowSteps.map((step, index) => (
            <SortableStepCard
              key={step.id}
              step={step}
              index={index}
              onEdit={setEditingStep}
            />
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-8 text-xs gap-1.5 border-dashed mt-2"
            onClick={() => {
              setWorkflowSteps(steps => [...steps, {
                id: `step-${steps.length + 1}`,
                type: 'new_step',
                description: 'Click to configure'
              }]);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Step
          </Button>
        </div>
      </SortableContext>
    </DndContext>
  );

  // Add this inside the visual builder section where steps are rendered
  const renderStepCard = (step: any, index: number) => (
    <Card key={index} className="p-2 bg-white group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move opacity-0 group-hover:opacity-100" />
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="text-xs">{step.type.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex items-center gap-1">
          {step.api && (
            <Badge variant="secondary" className="text-[10px]">
              {step.api}
            </Badge>
          )}
          <Popover 
            open={typeof editingStep === 'number' && index === editingStep} 
            onOpenChange={(open) => setEditingStep(open ? index : null)}
          >
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium mb-2">Step Configuration</h4>
                  {step.api && API_MAPPINGS[step.api]?.fields && (
                    <div className="space-y-2">
                      {Object.entries(API_MAPPINGS[step.api].fields).map(([key, field]: [string, any]) => (
                        <div key={key}>
                          <label className="text-xs text-gray-600 mb-1 block">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-0.5">*</span>}
                          </label>
                          {field.type === 'select' ? (
                            <Select defaultValue={step.params?.[key]}>
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((option: string) => (
                                  <SelectItem key={option} value={option} className="text-xs">
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input 
                              className="h-7 text-xs" 
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              defaultValue={step.params?.[key]}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={() => setEditingStep(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-7 text-xs"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {step.api && editingStep === index && (
        <div className="mt-2 pl-8 border-t pt-2">
          <div className="text-xs text-gray-500">
            API Parameters
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col p-4">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium">Setup Progress</span>
            <span className="text-gray-400">•</span>
            <span>Step {currentStep} of {totalSteps}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[...Array(totalSteps)].map((_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-1.5" />
      </div>

      {/* Main Content */}
      <Card className="flex-1 p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold">Your AI-Powered Workflow</h2>
            <p className="text-xs text-gray-500">Select a pre-built workflow or create your own</p>
          </div>
          {viewMode === 'editor' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={handleGenerateWorkflow}
              disabled={isGenerating}
            >
              <Wand2 className="h-3.5 w-3.5" />
              {isGenerating ? "Generating..." : "Regenerate"}
            </Button>
          )}
        </div>

        {viewMode === 'suggestions' ? (
          <div className="flex-1 overflow-hidden grid grid-cols-3 gap-3">
            {/* Left Panel - Workflow Suggestions */}
            <div className="col-span-2 space-y-3 overflow-hidden flex flex-col">
              {/* Search and Filter */}
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    className="w-full pl-8 pr-4 py-1.5 text-xs rounded-md border"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category} className="text-xs">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Workflow Grid */}
              <div className="overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {filteredWorkflows.map((workflow) => (
                    <Card 
                      key={workflow.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedWorkflow.id === workflow.id ? 'border-blue-400 bg-blue-50/50' : ''
                      }`}
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-medium">{workflow.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{workflow.description}</p>
                        </div>
                        <Badge className="text-[10px]">{workflow.popularity}</Badge>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {workflow.apis.map(api => (
                          <Badge key={api} variant="secondary" className="text-[10px]">{api}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          <span className="text-xs text-gray-600">{workflow.skillMatch}% Match</span>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          Preview
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Enhanced Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium">Workflow Preview</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setPreviewMode(prev => prev === 'flow' ? 'json' : 'flow')}
                  >
                    {previewMode === 'flow' ? (
                      <><Code className="h-3.5 w-3.5 mr-1.5" /> JSON</>
                    ) : (
                      <><LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Flow</>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => setViewMode('editor')}
                  >
                    Use This Workflow
                  </Button>
                </div>
              </div>

              <Card className="p-2 bg-gray-50/50">
                {previewMode === 'flow' ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium mb-2">Triggers</div>
                      {selectedWorkflow.triggers.map((trigger, i) => (
                        <Card key={i} className="p-2 mb-2 bg-white">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs">{trigger}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-2">Steps</div>
                      <div className="space-y-2">
                        {selectedWorkflow.template.steps?.map((step, i) => renderStepCard(step, i))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full h-7 text-xs gap-1.5 border-dashed"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Step
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(selectedWorkflow.template, null, 2)}
                  </pre>
                )}
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden grid grid-cols-3 gap-3">
            {/* Left Panel - Workflow Builder */}
            <div className="col-span-2 space-y-3 overflow-y-auto">
              <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="visual" className="text-xs">
                    <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                    Visual Builder
                  </TabsTrigger>
                  <TabsTrigger value="code" className="text-xs">
                    <Code className="h-3.5 w-3.5 mr-1.5" />
                    JSON View
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="visual" className="mt-2">
                  <div className="grid grid-cols-4 gap-3">
                    {/* Toolbox Panel */}
                    <div className="space-y-4">
                      <div className="text-xs font-medium text-gray-500">Workflow Blocks</div>
                      
                      {/* Triggers */}
                      <div>
                        <div className="text-[10px] font-medium mb-1.5 text-gray-600">Triggers</div>
                        <div className="space-y-1">
                          {WORKFLOW_BLOCKS.triggers.map(block => (
                            <div
                              key={block.id}
                              className="flex items-center gap-2 p-2 bg-white rounded-md border border-dashed cursor-grab hover:bg-gray-50 transition-colors"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('block', JSON.stringify(block));
                              }}
                            >
                              <span className="text-lg">{block.icon}</span>
                              <span className="text-xs">{block.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conditions */}
                      <div>
                        <div className="text-[10px] font-medium mb-1.5 text-gray-600">Conditions</div>
                        <div className="space-y-1">
                          {WORKFLOW_BLOCKS.conditions.map(block => (
                            <div
                              key={block.id}
                              className="flex items-center gap-2 p-2 bg-white rounded-md border border-dashed cursor-grab hover:bg-gray-50 transition-colors"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('block', JSON.stringify(block));
                              }}
                            >
                              <span className="text-lg">{block.icon}</span>
                              <span className="text-xs">{block.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <div className="text-[10px] font-medium mb-1.5 text-gray-600">Actions</div>
                        <div className="space-y-1">
                          {WORKFLOW_BLOCKS.actions.map(block => (
                            <div
                              key={block.id}
                              className="flex items-center gap-2 p-2 bg-white rounded-md border border-dashed cursor-grab hover:bg-gray-50 transition-colors"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('block', JSON.stringify(block));
                              }}
                            >
                              <span className="text-lg">{block.icon}</span>
                              <span className="text-xs">{block.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Workflow Canvas */}
                    <div className="col-span-3 bg-gray-50/50 rounded-lg p-4">
                      <div 
                        className="min-h-[400px] relative"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('bg-blue-50/50');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('bg-blue-50/50');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('bg-blue-50/50');
                          const block = JSON.parse(e.dataTransfer.getData('block'));
                          setWorkflowSteps(steps => [...steps, {
                            ...block,
                            id: `step-${steps.length + 1}`
                          }]);
                        }}
                      >
                        {renderWorkflowSteps()}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5"
                          onClick={() => setWorkflowSteps(WORKFLOW_TEMPLATE.actions)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset Changes
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5"
                            onClick={() => {
                              // Add test workflow logic
                            }}
                          >
                            <Play className="h-3.5 w-3.5" />
                            Test Workflow
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs gap-1.5"
                            onClick={() => {
                              // Add save workflow logic
                            }}
                          >
                            <Save className="h-3.5 w-3.5" />
                            Save Workflow
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="code" className="mt-2">
                  <Card className="p-3 bg-gray-50/50">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(WORKFLOW_TEMPLATE, null, 2)}
                    </pre>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Panel - API Suggestions */}
            <div className="space-y-3 overflow-y-auto">
              <div className="text-xs font-medium">Suggested APIs</div>
              {API_SUGGESTIONS.map((api) => (
                <Card key={api.name} className="p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{api.icon}</span>
                      <span className="text-sm font-medium">{api.name}</span>
                    </div>
                    <Badge 
                      variant={api.status === 'connected' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {api.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {api.actions.map((action) => (
                      <div 
                        key={action}
                        className="text-[10px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5"
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex justify-between items-center pt-3 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              Test
            </Button>
            <Button 
              size="sm" 
              className="gap-2"
              onClick={handleNext}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Sortable Step Card Component
interface SortableStepCardProps {
  step: {
    id: string;
    type: string;
    api?: string;
    params?: Record<string, any>;
    template?: string;
    content?: string;
    description?: string;
  };
  index: number;
  onEdit: (index: number | null) => void;
}

function SortableStepCard({ step, index, onEdit }: SortableStepCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.id });

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : 0
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`p-2 bg-white group ${isDragging ? 'shadow-lg' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <button 
              className="cursor-grab active:cursor-grabbing focus:outline-none" 
              {...attributes} 
              {...listeners}
            >
              <DragHandleDots2Icon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-xs font-medium">{step.type.replace(/_/g, ' ')}</span>
              {step.description && (
                <span className="text-[10px] text-gray-500">{step.description}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {step.api && (
              <Badge variant="secondary" className="text-[10px]">
                {step.api}
              </Badge>
            )}
            <Popover 
              open={isEditing} 
              onOpenChange={(open) => {
                setIsEditing(open);
                onEdit(open ? index : null);
              }}
            >
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="end">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium mb-2">Step Configuration</h4>
                    {step.api && API_MAPPINGS[step.api]?.fields && (
                      <div className="space-y-2">
                        {Object.entries(API_MAPPINGS[step.api].fields).map(([key, field]: [string, any]) => (
                          <div key={key}>
                            <label className="text-xs text-gray-600 mb-1 block">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-0.5">*</span>}
                            </label>
                            {field.type === 'select' ? (
                              <Select defaultValue={step.params?.[key]}>
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map((option: string) => (
                                    <SelectItem key={option} value={option} className="text-xs">
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input 
                                className="h-7 text-xs" 
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                defaultValue={step.params?.[key]}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => onEdit(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 text-xs"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {step.api && isEditing && (
          <div className="mt-2 pl-8 border-t pt-2">
            <div className="text-xs text-gray-500">
              API Parameters
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Enhanced Parameter Editor Component
interface ParameterEditorProps {
  field: {
    type: string;
    label: string;
    options?: string[];
  };
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

function ParameterEditor({ field, value, onChange, error }: ParameterEditorProps) {
  switch (field.type) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={value || false}
            onCheckedChange={onChange}
            size="sm"
          />
          <label className="text-xs text-gray-600">{field.label}</label>
        </div>
      );
    
    case 'radio':
      return field.options ? (
        <RadioGroup value={value} onValueChange={onChange} className="flex gap-3">
          {field.options.map(option => (
            <div key={option} className="flex items-center gap-1.5">
              <RadioGroupItem value={option} id={option} className="h-3 w-3" />
              <Label htmlFor={option} className="text-xs">{option}</Label>
            </div>
          ))}
        </RadioGroup>
      ) : null;
    
    case 'multiselect':
      return (
        <MultiSelect
          options={field.options}
          selected={value || []}
          onChange={onChange}
          placeholder="Select tags..."
        />
      );
    
    // ... other field types
  }
}

// Add MultiSelect component or import it
function MultiSelect({ options, selected, onChange, placeholder }: {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  return (
    <Select
      multiple
      value={selected}
      onChange={onChange}
      placeholder={placeholder}
    >
      {options.map(option => (
        <SelectItem key={option} value={option}>
          {option}
        </SelectItem>
      ))}
    </Select>
  );
} 