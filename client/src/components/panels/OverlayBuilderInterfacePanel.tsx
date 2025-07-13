import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Grid, 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Pause, 
  Settings, 
  Eye, 
  Download, 
  Upload,
  Zap,
  Target,
  Filter,
  Shuffle,
  RotateCcw,
  Copy,
  Link,
  Unlink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Search,
  Layers,
  Box,
  ArrowRight,
  ArrowLeft,
  Move,
  Resize,
  Palette,
  Code,
  Database,
  Cpu,
  Activity,
  BarChart3,
  TrendingUp,
  Shield,
  Crosshair,
  FileText,
  Workflow
} from 'lucide-react';

import {
  useAvailableBlocks,
  useCanvas,
  useUserCanvases,
  useCreateCanvas,
  useUpdateCanvas,
  useDeleteCanvas,
  useAddBlockToCanvas,
  useRemoveBlockFromCanvas,
  useUpdateBlockInCanvas,
  useCreateConnection,
  useDeleteConnection,
  useValidateCanvas,
  useSimulateOverlay,
  useSaveCanvas,
  useOverlayBuilderUtils,
  type OverlayBlock,
  type OverlayCanvas,
  type Connection,
  type OverlayCategory,
  type OverlayBlockType,
  type Position,
  type OverlaySimulationRequest,
  type CanvasValidation,
  type ComplexityLevel,
} from '@/services/overlayBuilderInterfaceService';

interface OverlayBuilderInterfacePanelProps {
  userId: string;
  canvasId?: string;
  className?: string;
}

export function OverlayBuilderInterfacePanel({ 
  userId, 
  canvasId,
  className = '' 
}: OverlayBuilderInterfacePanelProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'canvas' | 'blocks' | 'simulate' | 'settings'>('canvas');
  const [selectedCanvas, setSelectedCanvas] = useState<string>(canvasId || '');
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  const [draggedBlock, setDraggedBlock] = useState<OverlayBlock | null>(null);
  const [draggedConnection, setDraggedConnection] = useState<Connection | null>(null);
  const [canvasPosition, setCanvasPosition] = useState<Position>({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showCreateCanvas, setShowCreateCanvas] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [newCanvasDescription, setNewCanvasDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OverlayCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBlockDetails, setShowBlockDetails] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<OverlayBlock | null>(null);
  const [validation, setValidation] = useState<CanvasValidation | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    blockId: string;
    outputId: string;
    position: Position;
  } | null>(null);
  const [simulationMode, setSimulationMode] = useState<'historical' | 'realtime'>('historical');
  const [simulationAssets, setSimulationAssets] = useState<string[]>([]);
  const [simulationTimeRange, setSimulationTimeRange] = useState({
    start: '',
    end: '',
  });

  // Refs for drag and drop
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });

  // Service hooks
  const { data: availableBlocks = [], isLoading: blocksLoading } = useAvailableBlocks(
    selectedCategory === 'all' ? undefined : selectedCategory
  );
  const { data: canvas, isLoading: canvasLoading } = useCanvas(selectedCanvas);
  const { data: userCanvases = [], isLoading: canvasesLoading } = useUserCanvases(userId);
  const createCanvasMutation = useCreateCanvas(userId);
  const updateCanvasMutation = useUpdateCanvas(selectedCanvas, userId);
  const deleteCanvasMutation = useDeleteCanvas(userId);
  const addBlockMutation = useAddBlockToCanvas(selectedCanvas, userId);
  const removeBlockMutation = useRemoveBlockFromCanvas(selectedCanvas, userId);
  const updateBlockMutation = useUpdateBlockInCanvas(selectedCanvas, userId);
  const createConnectionMutation = useCreateConnection(selectedCanvas, userId);
  const deleteConnectionMutation = useDeleteConnection(selectedCanvas, userId);
  const validateCanvasMutation = useValidateCanvas(selectedCanvas, userId);
  const simulateOverlayMutation = useSimulateOverlay(userId);
  const saveCanvasMutation = useSaveCanvas(selectedCanvas, userId);
  const utils = useOverlayBuilderUtils(userId);

  // Filtered blocks
  const filteredBlocks = useMemo(() => {
    return availableBlocks.filter(block => {
      const matchesSearch = !searchTerm || 
        block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        block.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [availableBlocks, searchTerm, selectedCategory]);

  // Canvas operations
  const handleCreateCanvas = useCallback(async () => {
    if (!newCanvasName.trim()) {
      Toast({ title: 'Error', description: 'Please enter a canvas name' });
      return;
    }

    try {
      const newCanvas = await createCanvasMutation.mutateAsync({
        name: newCanvasName,
        description: newCanvasDescription,
      });
      
      setSelectedCanvas(newCanvas.id);
      setShowCreateCanvas(false);
      setNewCanvasName('');
      setNewCanvasDescription('');
      Toast({ title: 'Success', description: 'Canvas created successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to create canvas' });
    }
  }, [newCanvasName, newCanvasDescription, createCanvasMutation]);

  const handleDeleteCanvas = useCallback(async (canvasId: string) => {
    try {
      await deleteCanvasMutation.mutateAsync(canvasId);
      if (selectedCanvas === canvasId) {
        setSelectedCanvas('');
      }
      Toast({ title: 'Success', description: 'Canvas deleted successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to delete canvas' });
    }
  }, [deleteCanvasMutation, selectedCanvas]);

  const handleSaveCanvas = useCallback(async () => {
    if (!selectedCanvas) return;

    try {
      await saveCanvasMutation.mutateAsync();
      Toast({ title: 'Success', description: 'Canvas saved successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to save canvas' });
    }
  }, [selectedCanvas, saveCanvasMutation]);

  // Block operations
  const handleAddBlock = useCallback(async (blockType: OverlayBlockType, position: Position) => {
    if (!selectedCanvas) return;

    const baseBlock = availableBlocks.find(b => b.type === blockType);
    if (!baseBlock) return;

    const newBlock: OverlayBlock = {
      ...baseBlock,
      id: `block-${Date.now()}`,
      position,
      isActive: true,
      connections: [],
    };

    try {
      await addBlockMutation.mutateAsync(newBlock);
      Toast({ title: 'Success', description: 'Block added successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to add block' });
    }
  }, [selectedCanvas, availableBlocks, addBlockMutation]);

  const handleRemoveBlock = useCallback(async (blockId: string) => {
    if (!selectedCanvas) return;

    try {
      await removeBlockMutation.mutateAsync(blockId);
      setSelectedBlocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(blockId);
        return newSet;
      });
      Toast({ title: 'Success', description: 'Block removed successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to remove block' });
    }
  }, [selectedCanvas, removeBlockMutation]);

  const handleUpdateBlock = useCallback(async (blockId: string, updates: Partial<OverlayBlock>) => {
    if (!selectedCanvas) return;

    try {
      await updateBlockMutation.mutateAsync({ blockId, updates });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to update block' });
    }
  }, [selectedCanvas, updateBlockMutation]);

  const handleMoveBlock = useCallback(async (blockId: string, position: Position) => {
    if (snapToGrid) {
      position.x = Math.round(position.x / 20) * 20;
      position.y = Math.round(position.y / 20) * 20;
    }

    await handleUpdateBlock(blockId, { position });
  }, [snapToGrid, handleUpdateBlock]);

  // Connection operations
  const handleStartConnection = useCallback((blockId: string, outputId: string, position: Position) => {
    setIsConnecting(true);
    setConnectionStart({ blockId, outputId, position });
  }, []);

  const handleCompleteConnection = useCallback(async (
    targetBlockId: string,
    targetInputId: string
  ) => {
    if (!connectionStart || !selectedCanvas) return;

    const sourceBlock = canvas?.blocks.find(b => b.id === connectionStart.blockId);
    const targetBlock = canvas?.blocks.find(b => b.id === targetBlockId);

    if (!sourceBlock || !targetBlock) return;

    const validationResult = utils.validateConnection(
      sourceBlock,
      connectionStart.outputId,
      targetBlock,
      targetInputId
    );

    if (!validationResult.isValid) {
      Toast({ 
        title: 'Invalid Connection', 
        description: validationResult.errors.join(', ') 
      });
      return;
    }

    const newConnection: Connection = {
      id: `connection-${Date.now()}`,
      sourceBlockId: connectionStart.blockId,
      sourceOutputId: connectionStart.outputId,
      targetBlockId,
      targetInputId,
      type: 'data',
      weight: 1,
      isActive: true,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        latency: 0,
        throughput: 0,
        reliability: 1,
        dataFlow: {
          sampleRate: 1,
          bufferSize: 1024,
          compression: false,
          encryption: false,
        },
      },
    };

    try {
      await createConnectionMutation.mutateAsync(newConnection);
      Toast({ title: 'Success', description: 'Connection created successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to create connection' });
    } finally {
      setIsConnecting(false);
      setConnectionStart(null);
    }
  }, [connectionStart, selectedCanvas, canvas, utils, createConnectionMutation]);

  const handleDeleteConnection = useCallback(async (connectionId: string) => {
    if (!selectedCanvas) return;

    try {
      await deleteConnectionMutation.mutateAsync(connectionId);
      setSelectedConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
      Toast({ title: 'Success', description: 'Connection deleted successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to delete connection' });
    }
  }, [selectedCanvas, deleteConnectionMutation]);

  // Validation and simulation
  const handleValidateCanvas = useCallback(async () => {
    if (!selectedCanvas) return;

    try {
      const result = await validateCanvasMutation.mutateAsync();
      setValidation(result);
      Toast({ 
        title: result.isValid ? 'Validation Passed' : 'Validation Failed',
        description: result.isValid ? 'Canvas is valid' : `${result.errors.length} errors found`
      });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to validate canvas' });
    }
  }, [selectedCanvas, validateCanvasMutation]);

  const handleSimulateOverlay = useCallback(async () => {
    if (!selectedCanvas || !simulationTimeRange.start || !simulationTimeRange.end) {
      Toast({ title: 'Error', description: 'Please configure simulation parameters' });
      return;
    }

    const request: OverlaySimulationRequest = {
      canvasId: selectedCanvas,
      timeRange: {
        start: simulationTimeRange.start,
        end: simulationTimeRange.end,
        interval: '1d',
      },
      assets: simulationAssets,
      parameters: {},
      options: {
        mode: simulationMode,
        resolution: 1,
        includeMetrics: true,
        includeVisualization: true,
        realtime: simulationMode === 'realtime',
        caching: true,
      },
    };

    try {
      const result = await simulateOverlayMutation.mutateAsync(request);
      Toast({ 
        title: 'Simulation Complete', 
        description: `Simulation completed in ${result.duration}ms` 
      });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to simulate overlay' });
    }
  }, [selectedCanvas, simulationTimeRange, simulationAssets, simulationMode, simulateOverlayMutation]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, block: OverlayBlock) => {
    setDraggedBlock(block);
    e.dataTransfer.setData('application/json', JSON.stringify(block));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedBlock || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const position: Position = {
      x: (e.clientX - rect.left - canvasPosition.x) / canvasZoom,
      y: (e.clientY - rect.top - canvasPosition.y) / canvasZoom,
    };

    handleAddBlock(draggedBlock.type, position);
    setDraggedBlock(null);
  }, [draggedBlock, canvasPosition, canvasZoom, handleAddBlock]);

  // Canvas pan and zoom
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle click or Ctrl+click
      isDragging.current = true;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      setCanvasPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleCanvasMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasZoom(prev => Math.min(3, Math.max(0.1, prev * zoomDelta)));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSaveCanvas();
            break;
          case 'z':
            e.preventDefault();
            // Undo functionality would go here
            break;
          case 'y':
            e.preventDefault();
            // Redo functionality would go here
            break;
          case 'a':
            e.preventDefault();
            if (canvas) {
              setSelectedBlocks(new Set(canvas.blocks.map(b => b.id)));
            }
            break;
        }
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedBlocks.forEach(blockId => handleRemoveBlock(blockId));
        selectedConnections.forEach(connectionId => handleDeleteConnection(connectionId));
        setSelectedBlocks(new Set());
        setSelectedConnections(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, selectedBlocks, selectedConnections, handleSaveCanvas, handleRemoveBlock, handleDeleteConnection]);

  // Render block component
  const renderBlock = useCallback((block: OverlayBlock) => {
    const isSelected = selectedBlocks.has(block.id);
    const complexityColor = utils.getComplexityColor(block.metadata.complexity);
    
    return (
      <div
        key={block.id}
        className={`absolute bg-white border-2 rounded-lg shadow-md p-3 cursor-move min-w-[160px] ${
          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
        }`}
        style={{
          left: block.position.x,
          top: block.position.y,
          borderColor: isSelected ? '#3B82F6' : complexityColor,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.ctrlKey || e.metaKey) {
            setSelectedBlocks(prev => {
              const newSet = new Set(prev);
              if (newSet.has(block.id)) {
                newSet.delete(block.id);
              } else {
                newSet.add(block.id);
              }
              return newSet;
            });
          } else {
            setSelectedBlocks(new Set([block.id]));
          }
        }}
        onDoubleClick={() => {
          setSelectedBlock(block);
          setShowBlockDetails(true);
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {block.type === 'signal_generator' && <Target className="h-4 w-4" />}
            {block.type === 'filter' && <Filter className="h-4 w-4" />}
            {block.type === 'transformer' && <Shuffle className="h-4 w-4" />}
            {block.type === 'combiner' && <Layers className="h-4 w-4" />}
            {block.type === 'weight_calculator' && <BarChart3 className="h-4 w-4" />}
            {block.type === 'risk_manager' && <Shield className="h-4 w-4" />}
            {block.type === 'execution_trigger' && <Zap className="h-4 w-4" />}
            {block.type === 'data_source' && <Database className="h-4 w-4" />}
            {block.type === 'output_formatter' && <FileText className="h-4 w-4" />}
            {block.type === 'custom_logic' && <Code className="h-4 w-4" />}
            <span className="text-sm font-medium">{block.name}</span>
          </div>
          <Badge variant={block.isActive ? 'default' : 'secondary'} className="text-xs">
            {block.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="text-xs text-gray-500 mb-2 truncate">
          {block.description}
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <Badge variant="outline" style={{ borderColor: complexityColor }}>
            {block.metadata.complexity}
          </Badge>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>{block.metadata.performance.reliability.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Input/Output ports */}
        <div className="mt-2 flex justify-between">
          <div className="flex flex-col space-y-1">
            {block.inputs.map((input, index) => (
              <div
                key={input.id}
                className="w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600"
                title={input.name}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isConnecting && connectionStart) {
                    handleCompleteConnection(block.id, input.id);
                  }
                }}
              />
            ))}
          </div>
          <div className="flex flex-col space-y-1">
            {block.outputs.map((output, index) => (
              <div
                key={output.id}
                className="w-3 h-3 bg-green-500 rounded-full cursor-pointer hover:bg-green-600"
                title={output.name}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleStartConnection(block.id, output.id, {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }, [selectedBlocks, utils, isConnecting, connectionStart, handleCompleteConnection, handleStartConnection]);

  // Render connection
  const renderConnection = useCallback((connection: Connection) => {
    const sourceBlock = canvas?.blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = canvas?.blocks.find(b => b.id === connection.targetBlockId);
    
    if (!sourceBlock || !targetBlock) return null;
    
    const isSelected = selectedConnections.has(connection.id);
    
    // Calculate line positions (simplified)
    const startX = sourceBlock.position.x + 160;
    const startY = sourceBlock.position.y + 40;
    const endX = targetBlock.position.x;
    const endY = targetBlock.position.y + 40;
    
    return (
      <line
        key={connection.id}
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={isSelected ? '#3B82F6' : connection.isActive ? '#10B981' : '#6B7280'}
        strokeWidth={isSelected ? 3 : 2}
        strokeDasharray={connection.isActive ? 'none' : '5,5'}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedConnections(new Set([connection.id]));
        }}
      />
    );
  }, [canvas, selectedConnections]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Workflow className="h-5 w-5" />
              <span>Overlay Builder Interface</span>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedCanvas} onValueChange={setSelectedCanvas}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select canvas" />
                </SelectTrigger>
                <SelectContent>
                  {userCanvases.map(canvas => (
                    <SelectItem key={canvas.id} value={canvas.id}>
                      {canvas.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowCreateCanvas(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Canvas
              </Button>
              <Button onClick={handleSaveCanvas} size="sm" disabled={!selectedCanvas}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="canvas">
                <Grid className="h-4 w-4 mr-2" />
                Canvas
              </TabsTrigger>
              <TabsTrigger value="blocks">
                <Box className="h-4 w-4 mr-2" />
                Blocks
              </TabsTrigger>
              <TabsTrigger value="simulate">
                <Play className="h-4 w-4 mr-2" />
                Simulate
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="canvas" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={gridEnabled}
                      onCheckedChange={setGridEnabled}
                      id="grid-enabled"
                    />
                    <label htmlFor="grid-enabled" className="text-sm">Grid</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={snapToGrid}
                      onCheckedChange={setSnapToGrid}
                      id="snap-to-grid"
                    />
                    <label htmlFor="snap-to-grid" className="text-sm">Snap to Grid</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Zoom:</span>
                    <Slider
                      value={[canvasZoom]}
                      onValueChange={(value) => setCanvasZoom(value[0])}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-20"
                    />
                    <span className="text-sm w-12">{Math.round(canvasZoom * 100)}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleValidateCanvas} 
                    size="sm"
                    variant="outline"
                    disabled={!selectedCanvas}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Validate
                  </Button>
                  {validation && (
                    <Badge variant={validation.isValid ? 'default' : 'destructive'}>
                      {validation.isValid ? 'Valid' : `${validation.errors.length} errors`}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="relative">
                <div
                  ref={canvasRef}
                  className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden"
                  style={{
                    width: '100%',
                    height: '600px',
                    backgroundImage: gridEnabled ? 
                      'radial-gradient(circle, #ccc 1px, transparent 1px)' : 
                      'none',
                    backgroundSize: `${20 * canvasZoom}px ${20 * canvasZoom}px`,
                    backgroundPosition: `${canvasPosition.x}px ${canvasPosition.y}px`,
                  }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onWheel={handleCanvasWheel}
                  onClick={() => {
                    setSelectedBlocks(new Set());
                    setSelectedConnections(new Set());
                  }}
                >
                  {/* Canvas content */}
                  <div
                    style={{
                      transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom})`,
                      transformOrigin: '0 0',
                    }}
                  >
                    {/* Connections */}
                    {canvas?.connections && (
                      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                        {canvas.connections.map(renderConnection)}
                      </svg>
                    )}
                    
                    {/* Blocks */}
                    <div className="relative" style={{ zIndex: 2 }}>
                      {canvas?.blocks.map(renderBlock)}
                    </div>
                    
                    {/* Connection line preview */}
                    {isConnecting && connectionStart && (
                      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
                        <line
                          x1={connectionStart.position.x}
                          y1={connectionStart.position.y}
                          x2={connectionStart.position.x}
                          y2={connectionStart.position.y}
                          stroke="#3B82F6"
                          strokeWidth={2}
                          strokeDasharray="5,5"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="blocks" className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search blocks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technical_analysis">Technical Analysis</SelectItem>
                    <SelectItem value="fundamental_analysis">Fundamental Analysis</SelectItem>
                    <SelectItem value="sentiment_analysis">Sentiment Analysis</SelectItem>
                    <SelectItem value="macro_economic">Macro Economic</SelectItem>
                    <SelectItem value="risk_management">Risk Management</SelectItem>
                    <SelectItem value="execution_control">Execution Control</SelectItem>
                    <SelectItem value="data_processing">Data Processing</SelectItem>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBlocks.map(block => (
                    <Card
                      key={block.id}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => handleDragStart(e, block)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {block.type === 'signal_generator' && <Target className="h-4 w-4" />}
                            {block.type === 'filter' && <Filter className="h-4 w-4" />}
                            {block.type === 'transformer' && <Shuffle className="h-4 w-4" />}
                            {block.type === 'combiner' && <Layers className="h-4 w-4" />}
                            {block.type === 'weight_calculator' && <BarChart3 className="h-4 w-4" />}
                            {block.type === 'risk_manager' && <Shield className="h-4 w-4" />}
                            {block.type === 'execution_trigger' && <Zap className="h-4 w-4" />}
                            {block.type === 'data_source' && <Database className="h-4 w-4" />}
                            {block.type === 'output_formatter' && <FileText className="h-4 w-4" />}
                            {block.type === 'custom_logic' && <Code className="h-4 w-4" />}
                            <span className="font-medium">{block.name}</span>
                          </div>
                          <Badge variant="outline" style={{ borderColor: utils.getComplexityColor(block.metadata.complexity) }}>
                            {block.metadata.complexity}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{block.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {utils.formatCategory(block.category)}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-xs">{block.inputs.length}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-xs">{block.outputs.length}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="simulate" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Simulation Parameters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Simulation Mode</label>
                      <Select value={simulationMode} onValueChange={(value) => setSimulationMode(value as any)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="historical">Historical</SelectItem>
                          <SelectItem value="realtime">Real-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Start Date</label>
                        <Input
                          type="date"
                          value={simulationTimeRange.start}
                          onChange={(e) => setSimulationTimeRange(prev => ({ ...prev, start: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">End Date</label>
                        <Input
                          type="date"
                          value={simulationTimeRange.end}
                          onChange={(e) => setSimulationTimeRange(prev => ({ ...prev, end: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Assets</label>
                      <Input
                        placeholder="Enter asset symbols (comma separated)"
                        value={simulationAssets.join(', ')}
                        onChange={(e) => setSimulationAssets(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSimulateOverlay} 
                      disabled={!selectedCanvas || simulateOverlayMutation.isPending}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {simulateOverlayMutation.isPending ? 'Simulating...' : 'Run Simulation'}
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Simulation Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2" />
                      <p>Run a simulation to see results</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Canvas Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Grid Size</label>
                      <Slider
                        value={[20]}
                        onValueChange={() => {}}
                        min={10}
                        max={50}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Auto-save Interval</label>
                      <Select defaultValue="5">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minute</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="auto-validate" defaultChecked />
                      <label htmlFor="auto-validate" className="text-sm">Auto-validate on changes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="show-tooltips" defaultChecked />
                      <label htmlFor="show-tooltips" className="text-sm">Show tooltips</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="enable-animations" defaultChecked />
                      <label htmlFor="enable-animations" className="text-sm">Enable animations</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Canvas Dialog */}
      <Dialog open={showCreateCanvas} onOpenChange={setShowCreateCanvas}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Canvas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newCanvasName}
                onChange={(e) => setNewCanvasName(e.target.value)}
                placeholder="Enter canvas name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newCanvasDescription}
                onChange={(e) => setNewCanvasDescription(e.target.value)}
                placeholder="Enter canvas description"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateCanvas(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCanvas} disabled={createCanvasMutation.isPending}>
                {createCanvasMutation.isPending ? 'Creating...' : 'Create Canvas'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Details Dialog */}
      <Dialog open={showBlockDetails} onOpenChange={setShowBlockDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Block Details</DialogTitle>
          </DialogHeader>
          {selectedBlock && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedBlock.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedBlock.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Inputs</label>
                  <div className="mt-1 space-y-1">
                    {selectedBlock.inputs.map(input => (
                      <div key={input.id} className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>{input.name}</span>
                        <Badge variant="outline" className="text-xs">{input.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Outputs</label>
                  <div className="mt-1 space-y-1">
                    {selectedBlock.outputs.map(output => (
                      <div key={output.id} className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>{output.name}</span>
                        <Badge variant="outline" className="text-xs">{output.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Parameters</label>
                <div className="mt-1 space-y-2">
                  {selectedBlock.parameters.map(param => (
                    <div key={param.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">{param.name}</span>
                        <p className="text-xs text-muted-foreground">{param.description}</p>
                      </div>
                      <div className="text-sm font-mono">{JSON.stringify(param.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 