import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { fabric } from 'fabric';
import { 
  Camera, 
  CameraOff,
  Aperture, 
  Trash2, 
  Download, 
  FileText, 
  AlertCircle,
  Image as ImageIcon,
  Check,
  X,
  Edit3,
  Loader2,
  RefreshCw,
  Maximize2,
  Video,
  Square,
  Play,
  User,
  Building2,
  Stethoscope,
  Search,
  Plus,
  CloudUpload,
  CloudCheck,
  LogOut,
  ZoomIn,
  ZoomOut,
  Settings2,
  Hand,
  Circle,
  Type,
  ArrowUpRight,
  Undo,
  Save,
  MousePointer2,
  ChevronDown,
  Share2,
  ChevronRight,
  ChevronLeft,
  Layers,
  Database,
  Mail,
  History,
  Users,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Sun,
  Contrast,
  Droplets,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { toast, Toaster } from 'sonner';
import { cn } from './lib/utils';
import { 
  saveCapture, 
  getAllCaptures, 
  deleteCapture, 
  updateCapture 
} from './lib/db';
import { Odontogram, type DentitionType } from './components/Odontogram';
import { Logo } from './components/Logo';
import { SplashScreen } from './components/SplashScreen';
import { 
  getClinics, 
  getDentists, 
  searchPatients, 
  createPatient, 
  createSession,
  uploadImage,
  saveImageRecord,
  getPatientHistory,
  signIn,
  signUp,
  signOut,
  resetPassword,
  getSupabase
} from './lib/supabase';
import { 
  type Capture, 
  type Clinic, 
  type Dentist, 
  type Patient, 
  type Session 
} from './types';

export default function App() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [editingCapture, setEditingCapture] = useState<Capture | null>(null);
  const [selectedCaptures, setSelectedCaptures] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isStreamEnabled, setIsStreamEnabled] = useState(true);
  const [isOdontogramExpanded, setIsOdontogramExpanded] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<Capture | null>(null);

  // Cloud & Multi-tenant states
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [imageEditorUrl, setImageEditorUrl] = useState<string | null>(null);
  const [activeEditorTool, setActiveEditorTool] = useState<'select' | 'rect' | 'circle' | 'text' | 'arrow' | 'pan'>('select');
  const activeEditorToolRef = useRef(activeEditorTool);
  useEffect(() => {
    activeEditorToolRef.current = activeEditorTool;
  }, [activeEditorTool]);

  const [activeEditorColor, setActiveEditorColor] = useState<string>('#ef4444');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDashed, setIsDashed] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [newPatientDocument, setNewPatientDocument] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [isLoadingDentists, setIsLoadingDentists] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [odontogramData, setOdontogramData] = useState<{ denticao: DentitionType; dentes_selecionados: string[] }>({
    denticao: 'permanente',
    dentes_selecionados: []
  });
  
  // Auth states
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const editorCanvasElementRef = useRef<HTMLCanvasElement>(null);
  const initialScaleRef = useRef<number>(1);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (imageEditorUrl && editorCanvasElementRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(editorCanvasElementRef.current, {
        backgroundColor: '#f8fafc',
        enableRetinaScaling: true,
        preserveObjectStacking: true
      });
      fabricCanvasRef.current = canvas;

      fabric.Image.fromURL(imageEditorUrl, (img) => {
        if (!fabricCanvasRef.current) return;
        
        // Calculate scale to fit the available space better
        // Using floating toolbars, so we can use almost the entire window
        const maxWidth = Math.max(window.innerWidth - 80, 600);
        const maxHeight = Math.max(window.innerHeight - 80, 400);
        
        // Scale to fit the area (can scale up or down)
        const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
        initialScaleRef.current = scale;

        const canvasWidth = img.width! * scale;
        const canvasHeight = img.height! * scale;

        fabricCanvasRef.current.setDimensions({
          width: canvasWidth,
          height: canvasHeight
        });

        img.set({
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top'
        });

        fabricCanvasRef.current.setBackgroundImage(img, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
        
        // Reset filters and zoom
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        setZoomLevel(1);
        fabricCanvasRef.current.setZoom(1);
        fabricCanvasRef.current.viewportTransform = [1, 0, 0, 1, 0, 0];
      }, { crossOrigin: 'anonymous' });

      // Zoom and Pan events
      canvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        setZoomLevel(zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      let isDragging = false;
      let lastPosX: number;
      let lastPosY: number;

      canvas.on('mouse:down', (opt) => {
        const evt = opt.e;
        if (activeEditorToolRef.current === 'pan' || (!canvas.isDrawingMode && !canvas.getActiveObject() && !canvas.selection)) {
          isDragging = true;
          canvas.selection = false;
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
          canvas.defaultCursor = 'grabbing';
        }
      });

      canvas.on('mouse:move', (opt) => {
        if (isDragging) {
          const e = opt.e;
          const vpt = canvas.viewportTransform;
          if (!vpt) return;
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      });

      canvas.on('mouse:up', () => {
        isDragging = false;
        canvas.selection = activeEditorToolRef.current === 'select';
        canvas.defaultCursor = activeEditorToolRef.current === 'pan' ? 'grab' : 'default';
      });

      // Selection events
      const syncObjectProperties = () => {
        const active = canvas.getActiveObject();
        if (active && active.type !== 'i-text') {
          if (active.strokeWidth) setStrokeWidth(active.strokeWidth);
          setIsDashed(!!active.strokeDashArray);
          if (active.stroke) setActiveEditorColor(active.stroke as string);
        } else if (active && active.type === 'i-text') {
          if (active.fill) setActiveEditorColor(active.fill as string);
        }
      };

      canvas.on('selection:created', syncObjectProperties);
      canvas.on('selection:updated', syncObjectProperties);

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [imageEditorUrl]);

  // Tool handling
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = activeEditorTool === 'select';
    canvas.defaultCursor = activeEditorTool === 'pan' ? 'grab' : 'default';
    
    canvas.forEachObject(obj => {
      obj.selectable = activeEditorTool === 'select';
      obj.evented = activeEditorTool === 'select';
    });

    if (activeEditorTool !== 'select') {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  }, [activeEditorTool]);

  // Color handling
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'i-text') {
        activeObject.set('fill', activeEditorColor);
      } else {
        activeObject.set('stroke', activeEditorColor);
      }
      canvas.requestRenderAll();
    }
  }, [activeEditorColor]);

  // Filter handling
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const bgImage = canvas.backgroundImage as fabric.Image;
    if (bgImage) {
      bgImage.filters = [];
      
      if (brightness !== 0) {
        bgImage.filters.push(new fabric.Image.filters.Brightness({
          brightness: brightness / 100
        }));
      }
      
      if (contrast !== 0) {
        bgImage.filters.push(new fabric.Image.filters.Contrast({
          contrast: contrast / 100
        }));
      }
      
      if (saturation !== 0) {
        bgImage.filters.push(new fabric.Image.filters.Saturation({
          saturation: saturation / 100
        }));
      }

      bgImage.applyFilters();
      canvas.requestRenderAll();
    }
  }, [brightness, contrast, saturation]);

  // Stroke and Dash handling
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type !== 'i-text') {
      activeObject.set('strokeWidth', strokeWidth);
      activeObject.set('strokeDashArray', isDashed ? [10, 5] : null);
      canvas.requestRenderAll();
    }
  }, [strokeWidth, isDashed]);

  const addFabricRect = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'transparent',
      stroke: activeEditorColor,
      strokeWidth: strokeWidth,
      strokeDashArray: isDashed ? [10, 5] : null,
      width: 100,
      height: 100,
      cornerColor: '#3b82f6',
      cornerSize: 10,
      transparentCorners: false
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setActiveEditorTool('select');
  };

  const addFabricCircle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      fill: 'transparent',
      stroke: activeEditorColor,
      strokeWidth: strokeWidth,
      strokeDashArray: isDashed ? [10, 5] : null,
      radius: 50,
      cornerColor: '#3b82f6',
      cornerSize: 10,
      transparentCorners: false
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    setActiveEditorTool('select');
  };

  const addFabricArrow = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    // Create an arrow using a path
    const path = new fabric.Path('M 0 0 L 50 0 M 50 0 L 40 -5 M 50 0 L 40 5', {
      left: 100,
      top: 100,
      stroke: activeEditorColor,
      strokeWidth: strokeWidth,
      strokeDashArray: isDashed ? [10, 5] : null,
      fill: 'transparent',
      scaleX: 2,
      scaleY: 2,
      cornerColor: '#3b82f6',
      cornerSize: 10,
      transparentCorners: false
    });
    
    canvas.add(path);
    canvas.setActiveObject(path);
    setActiveEditorTool('select');
  };

  const addFabricText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText('Novo Texto', {
      left: 100,
      top: 100,
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: activeEditorColor,
      cornerColor: '#3b82f6',
      cornerSize: 10,
      transparentCorners: false
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveEditorTool('select');
  };

  const handleUndo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    if (objects.length > 0) {
      canvas.remove(objects[objects.length - 1]);
      canvas.requestRenderAll();
    }
  };

  const handleClearAll = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach(obj => canvas.remove(obj));
    canvas.requestRenderAll();
  };

  const handleDeleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    } else {
      toast.info('Selecione um objeto para deletar');
    }
  };

  // Auth listener
  useEffect(() => {
    const supabase = getSupabase();
    
    // Check current session
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAuthLoading(false);
      
      // If no user is found on initial load, don't force the 5s wait
      if (!currentUser) {
        setShowSplash(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAuthLoading(false);
      
      // If user logs out, hide splash if it's showing
      if (!currentUser) {
        setShowSplash(false);
      }
    });

    // Handle splash screen timeout
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 5000); // 5 seconds for a premium feel as requested

    return () => {
      subscription.unsubscribe();
      clearTimeout(splashTimeout);
    };
  }, []);

  // Load initial cloud data
  useEffect(() => {
    if (!user) return;
    const loadClinics = async () => {
      setIsLoadingClinics(true);
      try {
        const data = await getClinics();
        setClinics(data);
        if (data && data.length === 1) {
          setSelectedClinic(data[0]);
        }
        setConfigError(null);
      } catch (err) {
        console.error('Error loading clinics:', err);
        if (err instanceof Error && err.message.includes('Supabase URL')) {
          setConfigError(err.message);
        } else {
          toast.error('Erro ao carregar unidades do Supabase');
        }
      } finally {
        setIsLoadingClinics(false);
      }
    };
    loadClinics();
  }, [user]);

  // Load dentists when clinic changes
  useEffect(() => {
    if (!selectedClinic) {
      setDentists([]);
      setSelectedDentist(null);
      return;
    }
    const loadDentists = async () => {
      setIsLoadingDentists(true);
      try {
        const data = await getDentists(selectedClinic.id);
        setDentists(data);
        if (data && data.length === 0) {
          setSelectedDentist(null);
          toast.warning('Nenhum dentista encontrado para esta unidade');
        }
      } catch (err) {
        console.error('Error loading dentists:', err);
        toast.error('Erro ao carregar dentistas');
      } finally {
        setIsLoadingDentists(false);
      }
    };
    loadDentists();
  }, [selectedClinic]);

  // Patient search logic
  useEffect(() => {
    if (patientSearch.length < 3) {
      setPatients([]);
      setIsSearchingPatients(false);
      return;
    }

    // If the search string matches the selected patient's name exactly, don't search again
    const currentPatientName = selectedPatient?.name;
    if (selectedPatient && currentPatientName === patientSearch) {
      setIsSearchingPatients(false);
      return;
    }

    setIsSearchingPatients(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await searchPatients(patientSearch, selectedClinic);
        console.log('Search results for:', patientSearch, data);
        setPatients(data);
      } catch (err) {
        console.error('Error searching patients:', err);
      } finally {
        setIsSearchingPatients(false);
      }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [patientSearch, selectedClinic?.id]);

  const handleCheckIn = async () => {
    if (!selectedClinic || !selectedDentist) {
      toast.error('Selecione a unidade e o dentista');
      return;
    }

    setIsCheckingIn(true);
    let patientToUse = selectedPatient;

    // If no patient selected but search has text, create new patient
    if (!patientToUse && patientSearch.length >= 3) {
      try {
        patientToUse = await createPatient({ 
          name: patientSearch,
          tenant_id: selectedClinic.id
        });
        setSelectedPatient(patientToUse);
      } catch (err) {
        console.error('Error creating patient during check-in:', err);
        toast.error('Erro ao cadastrar novo paciente');
        setIsCheckingIn(false);
        return;
      }
    }

    if (!patientToUse) {
      toast.error('Selecione ou digite o nome de um paciente');
      setIsCheckingIn(false);
      return;
    }

    try {
      const newSession = await createSession(selectedClinic.id, selectedDentist.id, patientToUse.id);
      setSession(newSession);
      setIsCheckInOpen(false);
      
      // Load history for the selected patient
      setIsLoadingHistory(true);
      const patientHistory = await getPatientHistory(patientToUse.id);
      setHistory(patientHistory);
      setIsLoadingHistory(false);
      
      toast.success('Sessão iniciada com sucesso');
    } catch (err: any) {
      console.error('Error creating session:', err);
      const errorMessage = err.message || 'Erro desconhecido';
      toast.error(`Erro ao iniciar sessão: ${errorMessage}`);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCreatePatient = async () => {
    if (!patientSearch || patientSearch.trim().length < 3) {
      toast.error('O nome do paciente deve ter pelo menos 3 caracteres');
      return;
    }

    if (newPatientEmail && !newPatientEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('E-mail inválido');
      return;
    }

    if (newPatientPhone && newPatientPhone.replace(/\D/g, '').length < 10) {
      toast.error('Telefone inválido (mínimo 10 dígitos)');
      return;
    }

    try {
      const newPatient = await createPatient({
        name: patientSearch.trim(),
        document_id: newPatientDocument.trim(),
        email: newPatientEmail.trim(),
        mobile_phone: newPatientPhone.trim(),
        tenant_id: selectedClinic?.id,
      });
      setSelectedPatient(newPatient);
      setIsCreatingPatient(false);
      setNewPatientDocument('');
      setNewPatientEmail('');
      setNewPatientPhone('');
      toast.success('Paciente cadastrado com sucesso');
    } catch (err: any) {
      console.error('Error creating patient:', err);
      const errorMessage = err.message || 'Erro desconhecido';
      toast.error(`Erro ao cadastrar paciente: ${errorMessage}`);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      await signIn(authEmail, authPassword);
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 5000);
      toast.success('Bem-vindo de volta!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao entrar');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (authPassword !== authConfirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (authPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setIsAuthLoading(true);
    try {
      await signUp(authEmail, authPassword, authName);
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 5000);
      toast.success('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      setAuthView('login');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      await resetPassword(authEmail);
      toast.success('E-mail de recuperação enviado!');
      setAuthView('login');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar e-mail');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSession(null);
      setSelectedClinic(null);
      setSelectedDentist(null);
      setSelectedPatient(null);
      toast.success('Até logo!');
    } catch (err: any) {
      toast.error('Erro ao sair');
    }
  };

  const optimizeImage = (blob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max 1080p for cloud storage
        const MAX_HEIGHT = 1080;
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((optimized) => resolve(optimized || blob), 'image/jpeg', 0.8);
        } else {
          resolve(blob);
        }
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  const syncCaptures = async () => {
    if (!session) return;
    
    const selectedList = captures.filter(c => selectedCaptures.has(c.id) && c.sync_status === 'pending');
    
    if (selectedList.length === 0) {
      toast.error('Selecione as imagens que deseja enviar para a nuvem.');
      return;
    }

    if (selectedList.length > 20) {
      toast.error('Limite de 20 imagens por sincronização atingido.');
      return;
    }

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;
    let lastError = '';
    
    for (const capture of selectedList) {
      try {
        // Optimize before upload
        const optimizedBlob = await optimizeImage(capture.blob);
        const path = `${session.id}/${capture.id}.jpg`;
        
        await uploadImage(optimizedBlob, path);
        await saveImageRecord({
          ...capture,
          blob: optimizedBlob,
          storage_path: path
        });
        
        const updated = { ...capture, sync_status: 'synced' as const, storage_path: path };
        await updateCapture(updated);
        setCaptures(prev => prev.map(c => c.id === capture.id ? updated : c));
        successCount++;
      } catch (err: any) {
        console.error('Sync error for capture:', capture.id, err);
        failCount++;
        lastError = err.message || 'Erro desconhecido';
      }
    }
    
    setIsSyncing(false);
    setSelectedCaptures(new Set());

    if (successCount > 0) {
      toast.success(`${successCount} imagens gravadas com sucesso no histórico.`);
      // Refresh history
      const patientHistory = await getPatientHistory(session.id_patient);
      setHistory(patientHistory);
    }

    if (failCount > 0) {
      toast.error(`Falha ao gravar ${failCount} imagens.`, {
        description: `Erro: ${lastError}`
      });
    }
  };

  const refreshStream = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    toast.info('Reiniciando feed da câmera...', {
      description: 'Atalho ESC pressionado.',
      duration: 2000
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        refreshStream();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshStream]);

  const refreshDevices = useCallback(async (requestPermission = false) => {
    setIsRefreshing(true);
    setCameraError(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setCameraError('Seu navegador não suporta acesso à câmera ou a conexão não é segura (HTTPS).');
      setIsRefreshing(false);
      return;
    }

    try {
      // 1. Try to get permission to unlock labels
      if (requestPermission) {
        try {
          console.log('Requesting camera permission...');
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          // If we got here, permission is granted!
          stream.getTracks().forEach(track => track.stop());
        } catch (permErr) {
          console.warn('Permission request failed or was ignored:', permErr);
        }
      }

      // 2. Enumerate devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      console.log('Found video devices:', videoDevices.length);
      setDevices(videoDevices);
      
      // 3. Select a device if none selected
      if (videoDevices.length > 0) {
        const isCurrentValid = videoDevices.some(d => d.deviceId === selectedDeviceId);
        if (!selectedDeviceId || !isCurrentValid) {
          // Prefer back camera on mobile if labels are available
          const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'));
          const bestDevice = backCamera || videoDevices.find(d => d.label) || videoDevices[0];
          setSelectedDeviceId(bestDevice.deviceId);
        }
      } else {
        setCameraError('Nenhuma câmera encontrada. Verifique se o hardware está conectado.');
      }
      
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Device discovery error:', err);
      setCameraError('Erro ao acessar o hardware de vídeo.');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedDeviceId]);

  // Initialize devices and captures
  useEffect(() => {
    if (showSplash || isAuthLoading) return;
    
    const init = async () => {
      try {
        // Always try to request permission on first load to unlock labels
        await refreshDevices(true);
        const storedCaptures = await getAllCaptures();
        setCaptures(storedCaptures);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    init();
  }, [refreshDevices]);

  // Handle stream setup
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startStream = async () => {
      if (!isStreamEnabled) return;
      
      // If no device is selected but we have devices, try to select one
      if (!selectedDeviceId && devices.length > 0) {
        setSelectedDeviceId(devices[0].deviceId);
        return;
      }

      setCameraError(null);

      try {
        // Try with the selected device ID first if available
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId ? {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } : {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };

        console.log('Starting stream with constraints:', constraints);
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = newStream;
        setStream(newStream);
        
        // If we didn't have a device ID before, update it now
        if (!selectedDeviceId) {
          const track = newStream.getVideoTracks()[0];
          const settings = track.getSettings();
          if (settings.deviceId) {
            setSelectedDeviceId(settings.deviceId);
            refreshDevices(false);
          }
        }
      } catch (err) {
        console.warn('Stream failed with exact ID or facingMode, trying basic fallback:', err);
        try {
          // Final fallback: basic getUserMedia
          const newStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          activeStream = newStream;
          setStream(newStream);
          refreshDevices(false);
        } catch (fallbackErr) {
          console.error('All stream attempts failed:', fallbackErr);
          if (!window.isSecureContext) {
            setCameraError('Acesso negado: A câmera requer uma conexão segura (HTTPS).');
          } else {
            setCameraError('Acesso à câmera negado ou hardware não encontrado. Verifique as permissões do navegador.');
          }
        }
      }
    };

    startStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId, refreshTrigger, isStreamEnabled]);

  // Dedicated effect to sync video element with stream
  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('Syncing video element with stream');
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.error('Video play error:', err));
    }
  }, [stream, cameraError]);

  const handleExit = () => {
    setSession(null);
    setSelectedPatient(null);
    setSelectedClinic(null);
    setSelectedDentist(null);
    setPatientSearch('');
    setCaptures([]);
    setSelectedCaptures(new Set());
    setOdontogramData({ denticao: 'permanente', dentes_selecionados: [] });
    toast.info('Sessão encerrada. Realize o check-in para um novo atendimento.');
  };

  const handleSelectAll = () => {
    const allIds = sessionCaptures.map(c => c.id);
    setSelectedCaptures(new Set(allIds));
  };

  const handleClearSessionCaptures = async () => {
    if (sessionCaptures.length === 0) return;
    
    try {
      const idsToDelete = sessionCaptures.map(c => c.id);
      for (const id of idsToDelete) {
        await deleteCapture(id);
      }
      setCaptures(prev => prev.filter(c => !idsToDelete.includes(c.id)));
      setSelectedCaptures(new Set());
      toast.success('Galeria da sessão limpa com sucesso.');
    } catch (err) {
      console.error('Error clearing captures:', err);
      toast.error('Erro ao limpar galeria.');
    }
  };

  const handleCapture = useCallback(async () => {
    console.log('handleCapture triggered');
    if (!videoRef.current || !canvasRef.current) {
      console.warn('Video or Canvas ref not ready', { video: !!videoRef.current, canvas: !!canvasRef.current });
      toast.error('Câmera não inicializada corretamente');
      return;
    }

    if (isCapturing) {
      console.log('Capture already in progress');
      return;
    }
    
    if (!session) {
      console.warn('No active session');
      toast.error('Nenhuma sessão ativa. Por favor, realize o check-in.');
      return;
    }

    // Local limit: 60 photos
    if (sessionCaptures.length >= 60) {
      toast.error('Limite de 60 fotos locais atingido para esta sessão.');
      return;
    }
    
    setIsCapturing(true);
    toast.info('Capturando imagem...');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Dynamic dimensions based on resolution
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Scale footer and fonts relative to height (base 1080p)
    const scaleFactor = videoHeight / 1080;
    const footerHeight = Math.max(140, Math.round(180 * scaleFactor)); 
    
    // Set canvas to original width but extended height
    canvas.width = videoWidth;
    canvas.height = videoHeight + footerHeight;
    
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true 
    });
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 1. Draw the actual clinical image at the top
    if (videoWidth === 0 || videoHeight === 0) {
      toast.error('O feed da câmera ainda não está pronto. Aguarde um momento.');
      setIsCapturing(false);
      return;
    }
    
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    // 2. Draw the footer background (Dark Slate for professional look)
    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(0, videoHeight, videoWidth, footerHeight);
    
    // 3. Configure text style
    const padding = Math.round(40 * scaleFactor);
    const line1Y = videoHeight + (footerHeight * 0.35);
    const line2Y = videoHeight + (footerHeight * 0.75);
    
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    
    // Format Date: DD/MM/AAAA HH:mm
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + 
                         now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Patient Name
    const patientName = selectedPatient?.name || 'Paciente não identificado';
    ctx.font = `bold ${Math.round(28 * scaleFactor)}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`PACIENTE: ${patientName.toUpperCase()}`, padding, line1Y);

    // Odontogram Data (Second Line)
    const selectedTeeth = odontogramData.dentes_selecionados;
    if (selectedTeeth.length > 0) {
      ctx.font = `bold ${Math.round(24 * scaleFactor)}px Inter, sans-serif`;
      ctx.fillStyle = '#38bdf8'; // Sky 400
      ctx.textAlign = 'left';
      ctx.fillText(`ODONTOGRAMA : ${selectedTeeth.join(' ')}`, padding, line2Y);
      ctx.fillStyle = '#ffffff'; // Reset
    }

    // Date & Time (Center-Right)
    ctx.font = `${Math.round(22 * scaleFactor)}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    const clinicInfo = `${selectedClinic?.unidade || selectedClinic?.name || 'Unidade SmileVision'}`.toUpperCase();
    const clinicWidth = ctx.measureText(clinicInfo).width;
    ctx.fillText(formattedDate, videoWidth - padding - clinicWidth - 20, line1Y);

    // Clinic (Right)
    ctx.font = `bold ${Math.round(22 * scaleFactor)}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(clinicInfo, videoWidth - padding, line1Y);
    
    // 4. Generate the final blob with the watermark
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsCapturing(false);
        toast.error('Erro ao gerar imagem final');
        return;
      }
      
      const newCapture: Capture = {
        id: crypto.randomUUID(),
        blob,
        name: `Captura ${new Date().toLocaleString()}`,
        notes: '',
        timestamp: Date.now(),
        id_session: session?.id,
        id_patient: session?.id_patient,
        id_dentist: session?.id_dentist,
        id_clinic: session?.id_clinic,
        sync_status: 'pending',
        odontogram_data: {
          denticao: odontogramData.denticao,
          dentes_selecionados: [...odontogramData.dentes_selecionados]
        }
      };
      
      setPendingCapture(newCapture);
      setIsCapturing(false);
      setIsOdontogramExpanded(true);
    }, 'image/jpeg', 0.95);
  }, [session, isCapturing, selectedPatient, selectedClinic, selectedDentist, odontogramData]);

  const confirmCapture = async (skipOdontogram = false) => {
    if (!pendingCapture) return;
    
    const captureToSave = {
      ...pendingCapture,
      odontogram_data: {
        denticao: skipOdontogram ? 'nenhuma' : odontogramData.denticao,
        dentes_selecionados: skipOdontogram ? [] : [...odontogramData.dentes_selecionados]
      }
    };

    try {
      await saveCapture(captureToSave);
      setCaptures(prev => [...prev, captureToSave]);
      setPendingCapture(null);
      toast.success(skipOdontogram ? 'Captura salva!' : 'Captura salva com odontograma!');
    } catch (err) {
      console.error('Error saving capture:', err);
      toast.error('Erro ao salvar captura localmente');
    }
  };

  const discardCapture = () => {
    setPendingCapture(null);
    toast.info('Captura descartada');
  };

  const handleDelete = async (id: string) => {
    await deleteCapture(id);
    setCaptures(prev => prev.filter(c => c.id !== id));
    const newSelected = new Set(selectedCaptures);
    newSelected.delete(id);
    setSelectedCaptures(newSelected);
  };

  const handleUpdate = async (updated: Capture) => {
    await updateCapture(updated);
    setCaptures(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditingCapture(null);
  };

  const handleSaveEdition = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !imageEditorUrl) return;

    const savingToast = toast.loading('Processando e salvando imagem editada...');
    try {
      // Export at high resolution
      const multiplier = Math.max(2, 1 / initialScaleRef.current);
      const dataURL = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.95,
        multiplier: multiplier
      });

      const response = await fetch(dataURL);
      const blob = await response.blob();

      const newCapture: Capture = {
        id: crypto.randomUUID(),
        blob,
        name: `Edição - ${new Date().toLocaleString()}`,
        notes: 'Imagem editada com marcações clínicas.',
        timestamp: Date.now(),
        id_session: session?.id,
        id_patient: session?.id_patient || selectedPatient?.id,
        id_dentist: session?.id_dentist || selectedDentist?.id,
        id_clinic: session?.id_clinic || selectedClinic?.id,
        sync_status: 'pending'
      };

      await saveCapture(newCapture);
      setCaptures(prev => [...prev, newCapture]);
      toast.dismiss(savingToast);
      toast.success('Edição salva como nova captura na galeria.');
      setImageEditorUrl(null);
    } catch (err) {
      console.error('Error saving edited capture:', err);
      toast.dismiss(savingToast);
      toast.error('Erro ao salvar edição.');
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedCaptures);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCaptures(newSelected);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    const pdf = new jsPDF();
    const selectedList = captures.filter(c => selectedCaptures.has(c.id));
    
    const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 1920, height: 1080 });
        img.src = dataUrl;
      });
    };

    try {
      // Header - Compacted & Professional
      // Logo Placeholder
      pdf.setDrawColor(29, 185, 84);
      pdf.setFillColor(29, 185, 84);
      pdf.roundedRect(15, 10, 12, 12, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('SV', 21, 17, { align: 'center' });
      pdf.text('PRO', 21, 20, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bertuol Odontologia Avançada', 105, 15, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      let y = 22;
      
      pdf.text(`Unidade: ${selectedClinic?.unidade || selectedClinic?.name || 'N/A'}`, 35, y);
      y += 5;
      pdf.text(`Dentista: ${selectedDentist?.name || 'N/A'}`, 35, y);
      y += 5;
      pdf.text(`Paciente: ${selectedPatient?.name || 'N/A'}`, 35, y);
      
      y += 12;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, y - 5, 195, y - 5);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Relatório de Imagens Clínicas', 105, y, { align: 'center' });
      
      y += 10;
      
      const margin = 15;
      const pageWidth = 210;
      const contentWidth = pageWidth - (margin * 2);
      const gap = 10;
      const imgWidth = (contentWidth - gap) / 2;

      for (let i = 0; i < selectedList.length; i++) {
        const capture = selectedList[i];
        let imgData: string;
        try {
          imgData = await blobToDataURL(capture.blob);
        } catch (e) {
          console.error('Failed to convert blob to data URL', e);
          continue;
        }
        
        const dimensions = await getImageDimensions(imgData);
        const imgHeight = (imgWidth * dimensions.height) / dimensions.width;

        const col = i % 2;
        const x = margin + (col * (imgWidth + gap));

        // Check if we need a new page (only on the start of a row)
        if (col === 0 && y + imgHeight + 15 > 285) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80, 80, 80);
        pdf.text(capture.name, x, y);
        
        try {
          pdf.addImage(imgData, 'JPEG', x, y + 2, imgWidth, imgHeight, undefined, 'FAST');
        } catch (e) {
          console.error('Failed to add image to PDF', e);
        }
        
        if (col === 1 || i === selectedList.length - 1) {
          y += imgHeight + 15;
        }
      }
      
      const patientName = selectedPatient?.name.replace(/\s+/g, '') || 'Paciente';
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      pdf.save(`${patientName}-Relatorio-${dateStr}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToZIP = async () => {
    setIsExporting(true);
    const zip = new JSZip();
    const selectedList = captures.filter(c => selectedCaptures.has(c.id));
    
    selectedList.forEach(capture => {
      zip.file(`${capture.name.replace(/[/\\?%*:|"<>]/g, '-')}.jpg`, capture.blob);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    
    const patientName = selectedPatient?.name.replace(/\s+/g, '') || 'Paciente';
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    a.download = `${patientName}-${dateStr}.zip`;
    
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const sessionCaptures = selectedPatient ? captures.filter(c => c.id_patient === selectedPatient.id) : [];

  const DashboardCard = ({ icon, title, description, onClick, color, isPrimary }: any) => (
    <motion.button
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[24px] p-6 text-left shadow-md border border-charcoal-100 transition-all flex flex-col justify-between min-h-[180px]",
        color
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
        isPrimary ? "bg-white/20 text-white" : "bg-charcoal-50 text-primary-500"
      )}>
        {icon}
      </div>
      <div>
        <h3 className={cn("text-lg font-bold mb-1", isPrimary ? "text-white" : "text-charcoal-900")}>{title}</h3>
        <p className={cn("text-xs font-medium leading-relaxed", isPrimary ? "text-white/80" : "text-charcoal-500")}>
          {description}
        </p>
      </div>
    </motion.button>
  );

  if ((isAuthLoading || showSplash) && !user) {
    return (
      <AnimatePresence>
        {(isAuthLoading || showSplash) && <SplashScreen key="splash-loading" />}
      </AnimatePresence>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
        <AnimatePresence>
          {showSplash && <SplashScreen key="splash-auth" />}
        </AnimatePresence>
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden relative z-10"
        >
          <div className="p-10">
            <div className="flex flex-col items-center gap-4 mb-10">
              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-primary-500/10 border border-charcoal-100">
                <Logo size={48} />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">SmileVision Pro</h1>
                <p className="text-charcoal-500 font-medium">
                  {authView === 'login' ? 'Gestão Inteligente de Imagens Clínicas' : 
                   authView === 'signup' ? 'Crie sua conta profissional' : 
                   'Recuperação de Acesso'}
                </p>
              </div>
            </div>

            <form 
              onSubmit={
                authView === 'login' ? handleSignIn : 
                authView === 'signup' ? handleSignUp : 
                handleResetPassword
              } 
              className="flex flex-col gap-5"
            >
              {authView === 'signup' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 font-medium transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">E-mail Profissional</label>
                <input 
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 font-medium transition-all"
                  placeholder="seu@email.com"
                />
              </div>

              {authView !== 'forgot' && (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">Senha</label>
                      {authView === 'login' && (
                        <button 
                          type="button"
                          onClick={() => setAuthView('forgot')}
                          className="text-[10px] font-bold text-primary-500 hover:text-primary-600 uppercase tracking-widest"
                        >
                          Esqueci a senha
                        </button>
                      )}
                    </div>
                    <input 
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 font-medium transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  {authView === 'signup' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">Confirmar Senha</label>
                      <input 
                        type="password"
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 font-medium transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  )}
                </>
              )}

              <button 
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isAuthLoading ? <Loader2 size={20} className="animate-spin" /> : (
                  authView === 'login' ? 'Entrar na Plataforma' : 
                  authView === 'signup' ? 'Criar Conta' : 
                  'Enviar E-mail de Recuperação'
                )}
              </button>
            </form>

            <div className="mt-8 text-center flex flex-col gap-3">
              {authView === 'login' ? (
                <button 
                  onClick={() => setAuthView('signup')}
                  className="text-sm font-bold text-primary-500 hover:text-primary-600 transition-colors"
                >
                  Não tem conta? Solicite acesso
                </button>
              ) : (
                <button 
                  onClick={() => setAuthView('login')}
                  className="text-sm font-bold text-primary-500 hover:text-primary-600 transition-colors"
                >
                  Voltar para o login
                </button>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border-t border-charcoal-100 text-center">
            <p className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">
              @2026 - Versão 1.0
            </p>
          </div>
        </motion.div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash-main" />}
      </AnimatePresence>
      <Toaster position="top-center" richColors />
      
      {/* Dashboard or Main Content */}
      {!session ? (
        <>
          <div className="flex-1 bg-charcoal-50 relative overflow-hidden flex flex-col">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px]" />
              <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Dashboard Header */}
            <header className="h-20 bg-white/80 backdrop-blur-md border-b border-charcoal-100 px-8 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-xl shadow-sm border border-charcoal-100">
                  <Logo size={32} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-charcoal-900 tracking-tight leading-none">SmileVision Pro</h1>
                  <p className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.2em] mt-1">Command Center</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest leading-none mb-1">Profissional</span>
                  <span className="text-sm font-bold text-charcoal-700">
                    {user?.user_metadata?.display_name || user?.email?.split('@')[0]}
                  </span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-2.5 text-charcoal-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </header>

            {/* Dashboard Content */}
            <main className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16">
              <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-charcoal-900 tracking-tight mb-2">Bem-vindo de volta</h2>
                  <p className="text-charcoal-500 font-medium">O que deseja realizar hoje na plataforma?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Iniciar Atendimento */}
                  <DashboardCard 
                    icon={<Play size={24} />}
                    title="Iniciar Atendimento"
                    description="Comece uma nova sessão de captura e diagnósticos em tempo real."
                    onClick={() => setIsCheckInOpen(true)}
                    color="bg-primary-500 text-white"
                    isPrimary
                  />

                  {/* Histórico de Capturas */}
                  <DashboardCard 
                    icon={<History size={24} />}
                    title="Histórico de Capturas"
                    description="Acesse exames e anotações de atendimentos anteriores."
                    onClick={() => setIsHistoryOpen(true)}
                    color="bg-white"
                  />

                  {/* Relatório Clínico */}
                  <DashboardCard 
                    icon={<ClipboardList size={24} />}
                    title="Relatório Clínico"
                    description="Gere documentos profissionais em PDF com imagens e anotações."
                    onClick={() => toast.info('Módulo de Relatórios em desenvolvimento')}
                    color="bg-white"
                  />

                  {/* Cadastro de Pacientes */}
                  <DashboardCard 
                    icon={<Users size={24} />}
                    title="Cadastro de Pacientes"
                    description="Gerencie sua base de dados de pacientes de forma segura."
                    onClick={() => {
                      setPatientSearch('');
                      setIsCreatingPatient(true);
                    }}
                    color="bg-white"
                  />

                  {/* Relatórios Gerenciais */}
                  <DashboardCard 
                    icon={<BarChart3 size={24} />}
                    title="Relatórios Gerenciais"
                    description="Acompanhe a produtividade e métricas da sua clínica."
                    onClick={() => toast.info('Módulo Gerencial em desenvolvimento')}
                    color="bg-white"
                  />
                </div>
              </div>
            </main>

            <footer className="p-6 text-center">
              <p className="text-[10px] font-bold text-charcoal-400 uppercase tracking-[0.3em]">
                SmileVision Pro &copy; 2026 - Inteligência Artificial Odontológica
              </p>
            </footer>
          </div>

          {/* Global History Overlay */}
          <AnimatePresence>
            {isHistoryOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-charcoal-900/90 backdrop-blur-md flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="w-full max-w-4xl h-[80vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
                >
                  <div className="p-8 border-b border-charcoal-100 flex items-center justify-between bg-charcoal-50/50">
                    <div>
                      <h2 className="text-2xl font-bold text-charcoal-900 flex items-center gap-3">
                        <div className="p-2 bg-primary-500 rounded-xl text-white">
                          <History size={24} />
                        </div>
                        Histórico de Capturas
                      </h2>
                      <p className="text-charcoal-500 font-medium mt-1">Consulte registros e exames anteriores</p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsHistoryOpen(false);
                        setSelectedPatient(null);
                        setHistory([]);
                      }}
                      className="p-3 hover:bg-charcoal-100 rounded-2xl text-charcoal-400 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                    {!selectedPatient ? (
                      <div className="max-w-xl mx-auto py-12">
                        <div className="relative mb-8">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-charcoal-400" size={20} />
                          <input 
                            type="text"
                            placeholder="Buscar paciente por nome..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-charcoal-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-[24px] text-lg font-medium transition-all outline-none"
                          />
                        </div>

                        <div className="space-y-3">
                          {isSearchingPatients ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-4">
                              <Loader2 size={32} className="text-primary-500 animate-spin" />
                              <p className="text-charcoal-500 font-medium">Buscando pacientes...</p>
                            </div>
                          ) : patients.length > 0 ? (
                            patients.map((p) => (
                              <button
                                key={p.id}
                                onClick={async () => {
                                  setSelectedPatient(p);
                                  setIsLoadingHistory(true);
                                  try {
                                    const patientHistory = await getPatientHistory(p.id);
                                    setHistory(patientHistory);
                                  } catch (err) {
                                    toast.error('Erro ao carregar histórico');
                                  } finally {
                                    setIsLoadingHistory(false);
                                  }
                                }}
                                className="w-full p-5 bg-white border border-charcoal-100 hover:border-primary-500 hover:shadow-lg rounded-2xl text-left transition-all flex items-center justify-between group"
                              >
                                <div>
                                  <p className="font-bold text-charcoal-900 group-hover:text-primary-600 transition-colors">{p.name}</p>
                                  <p className="text-xs text-charcoal-500 font-medium mt-1">Documento: {p.document || 'Não informado'}</p>
                                </div>
                                <ChevronRight size={20} className="text-charcoal-300 group-hover:text-primary-500 transition-colors" />
                              </button>
                            ))
                          ) : patientSearch.length >= 3 ? (
                            <div className="py-12 text-center">
                              <p className="text-charcoal-500 font-medium">Nenhum paciente encontrado.</p>
                            </div>
                          ) : (
                            <div className="py-12 text-center opacity-40">
                              <Users size={48} className="mx-auto mb-4" />
                              <p className="text-charcoal-500 font-medium">Digite pelo menos 3 letras para buscar</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        <div className="mb-8 flex items-center justify-between">
                          <button 
                            onClick={() => {
                              setSelectedPatient(null);
                              setHistory([]);
                            }}
                            className="flex items-center gap-2 text-primary-500 font-bold hover:gap-3 transition-all"
                          >
                            <ChevronLeft size={20} /> Voltar para busca
                          </button>
                          <div className="text-right">
                            <p className="text-xs font-bold text-charcoal-400 uppercase tracking-widest">Paciente Selecionado</p>
                            <p className="text-lg font-bold text-charcoal-900">{selectedPatient.name}</p>
                          </div>
                        </div>

                        {isLoadingHistory ? (
                          <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <Loader2 size={48} className="text-primary-500 animate-spin" />
                            <p className="text-charcoal-500 font-medium">Carregando histórico...</p>
                          </div>
                        ) : history.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-charcoal-400 gap-4 opacity-60">
                            <div className="p-8 bg-white rounded-full border-2 border-dashed border-charcoal-200">
                              <CloudUpload size={48} strokeWidth={1.5} />
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-charcoal-900">Nenhum registro encontrado</p>
                              <p className="text-sm max-w-xs mx-auto">Este paciente ainda não possui capturas sincronizadas na nuvem.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map((item) => {
                              const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/captures/${item.storage_path}`;
                              return (
                                <div key={item.id} className="bg-white border border-charcoal-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                  <div className="aspect-video relative overflow-hidden">
                                    <img 
                                      src={imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                      <button 
                                        onClick={() => setZoomImage(imageUrl)}
                                        className="w-full py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                                      >
                                        <Maximize2 size={14} /> Visualizar
                                      </button>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <p className="font-bold text-charcoal-900 text-sm truncate">{item.name}</p>
                                    <div className="flex items-center justify-between mt-2">
                                      <p className="text-[10px] text-charcoal-500 font-medium">{new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                                      <div className="flex items-center gap-1 text-[10px] text-primary-500 font-bold">
                                        <CloudCheck size={12} /> Sincronizado
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isCheckInOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-charcoal-900/90 backdrop-blur-md flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl"
                >
                  <div className="p-8 border-b border-charcoal-100 bg-white/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-charcoal-900 tracking-tight">Identificação do atendimento</h2>
                        <p className="text-charcoal-500 text-sm">Selecione a unidade, o profissional e o paciente para registrar o atendimento.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsCheckInOpen(false)}
                      className="p-2 hover:bg-charcoal-50 rounded-full text-charcoal-400 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {configError ? (
                    <div className="p-12 flex flex-col items-center text-center gap-4">
                      <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
                        <AlertCircle size={48} />
                      </div>
                      <div className="max-w-md">
                        <h3 className="text-lg font-bold text-charcoal-900 mb-2">Configuração Necessária</h3>
                        <p className="text-charcoal-500 text-sm leading-relaxed">
                          Para utilizar as funcionalidades de nuvem, você precisa configurar as credenciais do Supabase no menu de <strong>Settings</strong> do AI Studio.
                        </p>
                        <div className="mt-6 p-4 bg-white rounded-xl border border-charcoal-200 text-left">
                          <p className="text-xs font-bold text-charcoal-500 uppercase tracking-widest mb-2">Variáveis Requeridas:</p>
                          <code className="text-xs text-charcoal-600 block bg-white p-2 rounded border border-charcoal-100 mb-1">VITE_SUPABASE_URL</code>
                          <code className="text-xs text-charcoal-600 block bg-white p-2 rounded border border-charcoal-100">VITE_SUPABASE_ANON_KEY</code>
                        </div>
                      </div>
                    </div>
                  ) : isLoadingClinics && clinics.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                      <Loader2 size={48} className="text-primary-500 animate-spin" />
                      <p className="text-charcoal-500 font-medium">Carregando unidades disponíveis...</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-8 flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Clinic Selection */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest flex items-center gap-2">
                              <Building2 size={12} /> Unidade
                            </label>
                            <div className="relative">
                              <select 
                                className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium disabled:opacity-50"
                                disabled={isLoadingClinics}
                                value={selectedClinic?.id || ''}
                                onChange={(e) => setSelectedClinic(clinics.find(c => c.id === e.target.value) || null)}
                              >
                                <option value="">{isLoadingClinics ? 'Carregando unidades...' : 'Selecione a unidade...'}</option>
                                {clinics.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {(c as any).unidade || (c as any).name || `Unidade ${c.id}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Dentist Selection */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest flex items-center gap-2">
                              <Stethoscope size={12} /> Dentista Executor
                            </label>
                            <div className="relative">
                              <select 
                                className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium disabled:opacity-50"
                                disabled={!selectedClinic || isLoadingDentists}
                                value={selectedDentist?.id || ''}
                                onChange={(e) => setSelectedDentist(dentists.find(d => d.id === e.target.value) || null)}
                              >
                                <option value="">{isLoadingDentists ? 'Carregando dentistas...' : 'Selecione o dentista...'}</option>
                                {dentists.map(d => (
                                  <option key={d.id} value={d.id}>
                                    {(d as any).nome_completo || (d as any).nome || (d as any).name || `Dentista ${d.id}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Patient Search */}
                        <AnimatePresence>
                          {selectedClinic && selectedDentist && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex flex-col gap-2 relative"
                            >
                              <div className="h-[1px] bg-charcoal-100 my-4" />
                              
                              <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest flex items-center gap-2">
                                <User size={12} /> Paciente
                              </label>
                              <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" size={16} />
                                <input 
                                  type="text"
                                  className="w-full pl-12 pr-12 py-4 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-lg"
                                  placeholder="Buscar por nome..."
                                  value={patientSearch}
                                  onChange={(e) => setPatientSearch(e.target.value)}
                                />
                              </div>

                              {/* Search Results */}
                              {patientSearch.length >= 3 && !selectedPatient && (
                                <div className="bg-white border border-charcoal-200 rounded-xl shadow-xl z-20 overflow-hidden mt-2">
                                  {patients.length > 0 ? (
                                    patients.map(p => (
                                      <button 
                                        key={p.id}
                                        className="w-full px-4 py-3 text-left hover:bg-white border-b border-charcoal-100 last:border-0 flex items-center justify-between group"
                                        onClick={() => {
                                          setSelectedPatient(p);
                                          setPatientSearch(p.name);
                                        }}
                                      >
                                        <span className="font-bold text-charcoal-700 group-hover:text-primary-600 transition-colors">
                                          {p.name}
                                        </span>
                                        <Check size={14} className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </button>
                                    ))
                                  ) : (
                                    <div className="p-4 text-center text-charcoal-500 text-sm">
                                      Nenhum paciente encontrado
                                    </div>
                                  )}
                                </div>
                              )}

                              {selectedPatient && (
                                <div className="mt-2 p-3 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Check size={14} className="text-primary-500" />
                                    <span className="text-sm font-bold text-primary-700">
                                      {selectedPatient.name}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setSelectedPatient(null);
                                      setPatientSearch('');
                                    }}
                                    className="text-primary-500 hover:text-primary-600"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="p-8 bg-charcoal-50 border-t border-charcoal-100 flex justify-end">
                        <button 
                          onClick={async () => {
                            await handleCheckIn();
                            if (session) setIsCheckInOpen(false);
                          }}
                          disabled={isCheckingIn || !selectedClinic || !selectedDentist || (!selectedPatient && patientSearch.length < 3)}
                          className="px-10 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-charcoal-200 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 transition-all flex items-center gap-2"
                        >
                          {isCheckingIn ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                          Cadastrar e Iniciar
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Patient Registration Modal */}
          <AnimatePresence>
            {isCreatingPatient && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[210] bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-accent-500 p-2 rounded-xl text-white">
                      <User size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-charcoal-900">Novo Paciente</h3>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest">Nome Completo</label>
                      <input 
                        type="text"
                        autoFocus
                        className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-500/20 font-medium transition-all"
                        placeholder="Nome do paciente"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest">Documento (Opcional)</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-500/20 font-medium transition-all"
                        placeholder="CPF ou RG"
                        value={newPatientDocument}
                        onChange={(e) => setNewPatientDocument(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest">E-mail</label>
                        <input 
                          type="email"
                          className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-500/20 font-medium transition-all"
                          placeholder="email@exemplo.com"
                          value={newPatientEmail}
                          onChange={(e) => setNewPatientEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest">Celular</label>
                        <input 
                          type="tel"
                          className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-500/20 font-medium transition-all"
                          placeholder="(00) 00000-0000"
                          value={newPatientPhone}
                          onChange={(e) => setNewPatientPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => setIsCreatingPatient(false)}
                        className="flex-1 px-4 py-4 bg-charcoal-100 text-charcoal-600 rounded-2xl font-bold hover:bg-charcoal-200 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleCreatePatient}
                        className="flex-1 px-4 py-4 bg-accent-500 text-white rounded-2xl font-bold hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/20"
                      >
                        Cadastrar
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-white border-b border-charcoal-200 px-6 py-3 flex items-center justify-between sticky top-0 z-[110] shadow-sm">
        {/* Left: System Branding & Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg border border-charcoal-100 shadow-sm">
              <Logo size={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-charcoal-900">SmileVision Pro</h1>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-charcoal-200" />

          {/* Hardware Status Indicator */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all",
            devices.length === 0 ? "border-amber-200 bg-amber-50" : "border-charcoal-100 bg-white"
          )}>
            <Video size={16} className={cn(devices.length === 0 ? "text-amber-500" : "text-primary-500")} />
            <select 
              className="bg-transparent text-xs font-bold outline-none cursor-pointer pr-2 max-w-[120px] truncate text-charcoal-700 uppercase tracking-wider"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              {devices.length === 0 && <option value="">Hardware...</option>}
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
            <button 
              onClick={() => refreshDevices(true)}
              disabled={isRefreshing}
              className={cn(
                "p-1 rounded-full transition-colors",
                devices.length === 0 
                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm" 
                  : "hover:bg-charcoal-200 text-charcoal-400"
              )}
              title="Habilitar/Buscar câmeras"
            >
              <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Center: Active Session Context */}
        {session && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-6 py-2 bg-primary-50 rounded-2xl border border-primary-100 shadow-sm shadow-primary-500/5"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest leading-none mb-1.5">Atendimento Ativo</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-primary-500" />
                  <span className="text-sm font-bold text-charcoal-800 leading-none">
                    {selectedPatient?.name}
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-primary-200" />
                <div className="flex items-center gap-2">
                  <Stethoscope size={14} className="text-primary-500" />
                  <span className="text-sm font-medium text-charcoal-600 leading-none">
                    Dr. {selectedDentist?.nome_completo}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Right: Actions & User */}
        <div className="flex items-center gap-4">
          {session && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-primary-50 text-primary-600 rounded-xl border border-primary-100 transition-all text-sm font-bold shadow-sm"
              >
                <ImageIcon size={18} /> Histórico
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  disabled={selectedCaptures.size === 0 || isExporting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20"
                >
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                  Exportar Dados
                  <ChevronDown size={16} className={cn("transition-transform", isExportMenuOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isExportMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsExportMenuOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-white border border-charcoal-200 rounded-2xl shadow-2xl z-30 overflow-hidden"
                      >
                        <div className="p-2 flex flex-col gap-1">
                          <button 
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              exportToPDF();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-bold text-charcoal-700 hover:bg-white rounded-xl transition-colors group"
                          >
                            <FileText size={18} className="text-charcoal-400 group-hover:text-primary-500" />
                            Relatório PDF
                          </button>
                          <button 
                            onClick={() => {
                              setIsExportMenuOpen(false);
                              exportToZIP();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-bold text-charcoal-700 hover:bg-white rounded-xl transition-colors group"
                          >
                            <Download size={18} className="text-charcoal-400 group-hover:text-accent-500" />
                            Exportar ZIP
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="h-8 w-[1px] bg-charcoal-200 mx-2" />

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-charcoal-500 uppercase tracking-widest leading-none mb-1">Usuário</span>
              <span className="text-xs font-bold text-charcoal-700">
                {user.user_metadata?.display_name || user.email?.split('@')[0]}
              </span>
            </div>
            <div className="w-10 h-10 bg-charcoal-100 rounded-xl flex items-center justify-center text-charcoal-500 overflow-hidden border border-charcoal-200 shadow-sm">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </div>
            <button 
              onClick={() => {
                setSession(null);
                setSelectedPatient(null);
                setPatientSearch('');
                toast.success('Atendimento finalizado com sucesso');
              }}
              className="p-2.5 bg-charcoal-50 hover:bg-charcoal-100 text-charcoal-600 rounded-xl transition-all shadow-sm border border-charcoal-200 flex items-center gap-2 px-4"
              title="Finalizar Atendimento"
            >
              <LayoutDashboard size={18} />
              <span className="text-xs font-bold">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-charcoal-950">
        {/* Full Screen Camera Viewport */}
        <section className="absolute inset-0 flex flex-col">
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {cameraError ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center z-10">
                <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                  <CameraOff size={48} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Falha na Conexão</h3>
                  <p className="text-charcoal-400 text-sm max-w-xs">{cameraError}</p>
                </div>
                <button 
                  onClick={() => refreshDevices(true)}
                  className="px-6 py-2 bg-white text-charcoal-900 rounded-xl font-bold text-sm hover:bg-charcoal-100 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Tentar Novamente
                </button>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-contain"
                />

                {/* Top Info Bar Overlay */}
                <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", stream ? "bg-accent-500" : "bg-red-500")} />
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-[10px] uppercase tracking-widest leading-none mb-1">
                          {stream ? 'Hardware Ativo' : 'Hardware Desconectado'}
                        </span>
                        <span className="text-white/40 text-[8px] font-bold uppercase tracking-tighter">Resolução: 1080p • 60fps</span>
                      </div>
                    </div>
                  </div>

                  {/* Status indicator removed */}
                </div>

                {/* Floating Odontogram Panel (Top Left) */}
                <div className="absolute top-4 left-6 z-40">
                  <motion.div 
                    initial={false}
                    animate={{ width: isOdontogramExpanded ? 360 : 64 }}
                    className="bg-white/95 backdrop-blur-3xl border border-charcoal-200 rounded-[32px] shadow-2xl overflow-hidden transition-all duration-500"
                  >
                    <div className="p-4 flex items-center justify-between border-b border-charcoal-100 bg-white/50">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setIsOdontogramExpanded(!isOdontogramExpanded)}
                          className="w-10 h-10 rounded-2xl bg-white border border-charcoal-200 shadow-sm hover:bg-white text-charcoal-600 flex items-center justify-center transition-all active:scale-95"
                        >
                          {isOdontogramExpanded ? <ChevronLeft size={20} /> : <Layers size={20} />}
                        </button>
                        {isOdontogramExpanded && (
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-charcoal-800 uppercase tracking-wider">Odontograma Clínico</span>
                            <span className="text-[9px] text-charcoal-500 font-medium">Selecione os elementos para a captura</span>
                          </div>
                        )}
                      </div>
                      {isOdontogramExpanded && (
                        <div className="flex items-center gap-2 pr-2">
                          <div className="px-3 py-1 bg-primary-500 text-white text-[10px] font-bold rounded-full shadow-sm ring-2 ring-primary-100">
                            {odontogramData.dentes_selecionados.length} dentes
                          </div>
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {isOdontogramExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4"
                        >
                          <div className="flex items-center justify-center">
                            <Odontogram 
                              onSelectionChange={setOdontogramData}
                              initialDentition={odontogramData.denticao}
                              initialSelection={odontogramData.dentes_selecionados}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Floating Gallery Panel (Top Right) */}
                <div className="absolute top-24 right-6 z-40">
                  <motion.div 
                    initial={false}
                    animate={{ width: isGalleryOpen ? 320 : 64, height: isGalleryOpen ? 500 : 64 }}
                    className="bg-white/95 backdrop-blur-3xl border border-charcoal-200 rounded-[32px] shadow-2xl overflow-hidden transition-all duration-500 flex flex-col"
                  >
                    <div className="p-4 flex items-center justify-between border-b border-charcoal-100 bg-white/50 min-h-[64px]">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                          className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm border",
                            isGalleryOpen ? "bg-white border-charcoal-200 text-charcoal-600" : "bg-primary-500 border-primary-400 text-white"
                          )}
                        >
                          {isGalleryOpen ? <ChevronRight size={20} /> : <ImageIcon size={20} />}
                        </button>
                        {isGalleryOpen && (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-charcoal-900 uppercase tracking-widest">Galeria da Sessão</span>
                            <span className="text-[9px] text-charcoal-500 font-medium">{sessionCaptures.length} capturas</span>
                          </div>
                        )}
                      </div>
                      {isGalleryOpen && (
                        <button 
                          onClick={syncCaptures}
                          disabled={isSyncing || sessionCaptures.filter(c => c.sync_status === 'pending').length === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl transition-all disabled:opacity-30 shadow-sm shadow-accent-200"
                          title="Sincronizar"
                        >
                          {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <Database size={20} />}
                          <span className="text-xs font-bold uppercase">Sincronizar Dados</span>
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {isGalleryOpen && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 flex flex-col overflow-hidden"
                        >
                          {/* Bulk Actions - Refined */}
                          <div className="p-2 border-b border-charcoal-100 bg-white/50 grid grid-cols-3 gap-1">
                            <button 
                              onClick={() => setSelectedCaptures(new Set(sessionCaptures.map(c => c.id)))}
                              className="px-2 py-1.5 bg-white border border-charcoal-200 hover:bg-primary-50 text-charcoal-600 text-[9px] font-bold uppercase rounded-lg transition-all shadow-sm"
                            >
                              Tudo
                            </button>
                            <button 
                              onClick={() => setSelectedCaptures(new Set())}
                              className="px-2 py-1.5 bg-white border border-charcoal-200 hover:bg-primary-50 text-charcoal-600 text-[9px] font-bold uppercase rounded-lg transition-all shadow-sm"
                            >
                              Nenhum
                            </button>
                            <button 
                              onClick={handleClearSessionCaptures}
                              className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-[9px] font-bold uppercase rounded-lg transition-all border border-red-100"
                            >
                              Limpar
                            </button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-charcoal-200 scrollbar-track-transparent">
                            {sessionCaptures.length === 0 ? (
                              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                <CameraOff size={32} className="text-charcoal-400 mb-2" />
                                <p className="text-charcoal-500 text-[10px] font-bold uppercase tracking-widest">Nenhuma captura</p>
                              </div>
                            ) : (
                              [...sessionCaptures].reverse().map((capture) => (
                                <motion.div 
                                  key={capture.id}
                                  layout
                                  className="relative group"
                                >
                                  <div className={cn(
                                    "aspect-video rounded-2xl overflow-hidden border transition-all shadow-lg bg-charcoal-100 relative",
                                    selectedCaptures.has(capture.id) ? "border-primary-500 ring-2 ring-primary-500/20" : "border-charcoal-200 group-hover:border-primary-500/50"
                                  )}>
                                    <img 
                                      src={URL.createObjectURL(capture.blob)} 
                                      alt={capture.name}
                                      className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Checkbox for selection */}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newSelected = new Set(selectedCaptures);
                                        if (newSelected.has(capture.id)) {
                                          newSelected.delete(capture.id);
                                        } else {
                                          newSelected.add(capture.id);
                                        }
                                        setSelectedCaptures(newSelected);
                                      }}
                                      className={cn(
                                        "absolute top-2 right-2 w-5 h-5 rounded-full border flex items-center justify-center transition-all z-10",
                                        selectedCaptures.has(capture.id) ? "bg-primary-500 border-primary-400 text-white" : "bg-white/80 backdrop-blur-sm border-charcoal-300 text-transparent"
                                      )}
                                    >
                                      <Check size={12} strokeWidth={3} />
                                    </button>

                                    <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <button 
                                        onClick={() => {
                                          const url = URL.createObjectURL(capture.blob);
                                          setZoomImage(url);
                                        }}
                                        className="p-2 bg-white/80 hover:bg-white rounded-xl text-charcoal-600 backdrop-blur-md transition-all shadow-lg border border-charcoal-200"
                                        title="Zoom"
                                      >
                                        <ZoomIn size={18} />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          const url = URL.createObjectURL(capture.blob);
                                          setImageEditorUrl(url);
                                        }}
                                        className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 backdrop-blur-md transition-all shadow-lg border border-primary-400"
                                        title="Editar Imagem"
                                      >
                                        <Edit3 size={18} />
                                      </button>
                                      <button 
                                        onClick={() => setEditingCapture(capture)}
                                        className="p-2 bg-white/80 hover:bg-white rounded-xl text-charcoal-600 backdrop-blur-md transition-all shadow-lg border border-charcoal-200"
                                        title="Editar Metadados"
                                      >
                                        <Settings2 size={18} />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(capture.id)}
                                        className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 backdrop-blur-md transition-all shadow-lg border border-red-100"
                                        title="Excluir"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {capture.odontogram_data?.dentes_selecionados && capture.odontogram_data.dentes_selecionados.length > 0 && (
                                    <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%]">
                                      {capture.odontogram_data.dentes_selecionados.map(tooth => (
                                        <span key={tooth} className="bg-primary-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-primary-400">
                                          {tooth}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div className="mt-2 flex items-center justify-between px-1">
                                    <span className="text-[9px] font-bold text-charcoal-400">{new Date(capture.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {capture.sync_status === 'synced' ? (
                                      <CloudCheck size={12} className="text-accent-500" />
                                    ) : (
                                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                                    )}
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Main Camera Controls Overlay */}
                <AnimatePresence>
                  {!pendingCapture && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 z-50"
                    >
                      <button 
                        onClick={() => setIsStreamEnabled(!isStreamEnabled)}
                        className={cn(
                          "w-14 h-14 rounded-[24px] flex items-center justify-center transition-all shadow-2xl border border-white/10 backdrop-blur-2xl",
                          isStreamEnabled 
                            ? "bg-white/5 text-white hover:bg-white/10" 
                            : "bg-accent-500 text-white hover:bg-accent-600 border-accent-400"
                        )}
                      >
                        {isStreamEnabled ? <Square size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                      </button>

                      <div className="relative">
                        <button 
                          onClick={handleCapture}
                          disabled={isCapturing || !isStreamEnabled}
                          className="w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-90 transition-all group disabled:opacity-50 relative z-10 bg-white"
                        >
                          <div className="w-20 h-20 rounded-full border-[6px] border-charcoal-950 flex items-center justify-center transition-colors group-hover:bg-charcoal-900">
                            <div className={cn(
                              "w-12 h-12 bg-red-500 rounded-full shadow-inner",
                              isStreamEnabled && !isCapturing && "animate-pulse"
                            )} />
                          </div>
                        </button>
                        {/* Ring animation on capture */}
                        {isCapturing && (
                          <motion.div 
                            initial={{ scale: 1, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            className="absolute inset-0 bg-white rounded-full z-0"
                          />
                        )}
                      </div>

                      <button 
                        onClick={handleClearSessionCaptures}
                        disabled={sessionCaptures.length === 0}
                        className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[24px] flex items-center justify-center hover:bg-red-500/20 backdrop-blur-2xl transition-all disabled:opacity-20 shadow-2xl"
                      >
                        <Trash2 size={22} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pending Capture Preview Overlay */}
                <AnimatePresence>
                  {pendingCapture && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex items-center justify-center"
                    >
                      <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
                        {/* Top Instruction Bar (Subtle Glassmorphism) */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
                          <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
                          <span className="text-white text-xs font-bold uppercase tracking-[0.2em]">Selecione os dentes e confirme</span>
                        </div>

                        <div className="relative max-w-full max-h-[75vh] group">
                          <img 
                            src={URL.createObjectURL(pendingCapture.blob)} 
                            alt="Preview" 
                            className="w-full h-full object-contain rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,0.6)] border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Metadata Tags (Corners) */}
                          <div className="absolute top-6 left-6 flex flex-col gap-1 pointer-events-none">
                            <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em]">Paciente</span>
                            <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                              {selectedPatient?.name || 'Não Identificado'}
                            </span>
                          </div>

                          <div className="absolute top-6 right-6 flex flex-col items-end gap-1 pointer-events-none">
                            <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em]">Registro</span>
                            <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                              {new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Action Bar (Horizontal) */}
                        <div className="mt-12 flex items-center gap-10">
                          {/* Discard Button (Left) */}
                          <button 
                            onClick={discardCapture}
                            className="w-14 h-14 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center border border-red-500/30 backdrop-blur-xl transition-all shadow-xl group"
                            title="Descartar"
                          >
                            <X size={24} className="group-hover:scale-110 transition-transform" />
                          </button>

                          {/* Confirm Button (Center) */}
                          <button 
                            onClick={() => confirmCapture(false)}
                            className="w-20 h-20 bg-accent-500 hover:bg-accent-600 text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] active:scale-95 transition-all group"
                            title="Confirmar com Odontograma"
                          >
                            <Check size={40} className="group-hover:scale-110 transition-transform" />
                          </button>

                          {/* Save without Odontogram (Right) */}
                          <button 
                            onClick={() => confirmCapture(true)}
                            className="h-14 px-8 bg-white/10 hover:bg-white text-white hover:text-charcoal-900 rounded-full flex items-center gap-3 border border-white/20 backdrop-blur-xl transition-all shadow-xl group font-bold text-xs uppercase tracking-widest"
                          >
                            <Save size={18} className="opacity-60 group-hover:opacity-100" />
                            <span>Salvar sem Odontograma</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Elements in Focus Overlay (Bottom Left) */}
                <AnimatePresence>
                  {odontogramData.dentes_selecionados.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-8 left-8 z-40 bg-black/40 backdrop-blur-2xl border border-white/10 p-4 rounded-[32px] shadow-2xl"
                    >
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-1">Foco Ativo</span>
                        <div className="flex flex-wrap gap-2 max-w-[200px]">
                          {odontogramData.dentes_selecionados.map(tooth => (
                            <motion.div 
                              key={tooth}
                              layoutId={`tooth-focus-${tooth}`}
                              className="w-12 h-12 bg-primary-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg shadow-primary-500/20 border border-primary-400"
                            >
                              {tooth}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {isCapturing && (
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[4px] flex items-center justify-center z-[60]">
                <div className="bg-white p-6 rounded-full shadow-2xl">
                  <Loader2 size={48} className="text-primary-500 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </section>

        <canvas ref={canvasRef} className="hidden" />
      </main>

      {/* Patient History Overlay */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-charcoal-900/80 backdrop-blur-md flex items-center justify-end"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-charcoal-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="bg-primary-500 p-2 rounded-xl text-white">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-charcoal-900 tracking-tight">Histórico Clínico</h2>
                    <p className="text-charcoal-500 text-sm">
                      Paciente: <span className="font-bold text-charcoal-700">{selectedPatient?.name}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {history.length >= 2 && (
                    <button 
                      onClick={() => {
                        setIsComparing(!isComparing);
                        setCompareSelection([]);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                        isComparing ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200"
                      )}
                    >
                      <Maximize2 size={14} />
                      {isComparing ? 'Sair da Comparação' : 'Comparar Antes/Depois'}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-3 hover:bg-charcoal-200 rounded-full transition-colors text-charcoal-400 hover:text-charcoal-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {isLoadingHistory ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <Loader2 size={48} className="text-primary-500 animate-spin" />
                    <p className="text-charcoal-500 font-medium">Carregando histórico oficial...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-charcoal-400 gap-4 opacity-60">
                    <div className="p-8 bg-white rounded-full border-2 border-dashed border-charcoal-200">
                      <CloudUpload size={48} strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-charcoal-900">Nenhum registro na nuvem</p>
                      <p className="text-sm max-w-xs mx-auto">Sincronize as capturas desta sessão para iniciar o histórico oficial deste paciente.</p>
                    </div>
                  </div>
                ) : isComparing ? (
                  <div className="flex flex-col h-full gap-6">
                    <div className="p-4 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {compareSelection.length}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary-900">Modo Comparação Ativo</p>
                          <p className="text-xs text-primary-600">Selecione exatamente 2 imagens para comparar</p>
                        </div>
                      </div>
                      {compareSelection.length === 2 && (
                        <button 
                          onClick={() => {
                            // This will be handled by a separate modal or view
                            toast.info('Visualização de comparação em tela cheia ativada');
                          }}
                          className="px-6 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
                        >
                          Ver Comparação
                        </button>
                      )}
                    </div>

                    {compareSelection.length === 2 ? (
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {compareSelection.map((id, index) => {
                          const item = history.find(h => h.id === id);
                          if (!item) return null;
                          const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/captures/${item.storage_path}`;
                          return (
                            <div key={id} className="flex flex-col gap-2">
                              <p className="text-xs font-bold text-charcoal-500 uppercase tracking-widest text-center">
                                {index === 0 ? 'Imagem 1 (Antes)' : 'Imagem 2 (Depois)'}
                              </p>
                              <div className="aspect-video relative rounded-2xl overflow-hidden border-2 border-primary-500 shadow-xl">
                                <img 
                                  src={imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button 
                                  onClick={() => setZoomImage(imageUrl)}
                                  className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-lg text-white backdrop-blur-md transition-colors"
                                >
                                  <ZoomIn size={16} />
                                </button>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-charcoal-900 text-sm">{item.name}</p>
                                <p className="text-[10px] text-charcoal-500">{new Date(item.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div className="md:col-span-2 flex justify-center mt-4">
                          <button 
                            onClick={() => setCompareSelection([])}
                            className="px-6 py-2 bg-charcoal-100 text-charcoal-600 rounded-xl text-xs font-bold hover:bg-charcoal-200 transition-all"
                          >
                            Limpar Seleção
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {history.map((item) => {
                          const isSelected = compareSelection.includes(item.id);
                          const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/captures/${item.storage_path}`;
                          return (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                if (isSelected) {
                                  setCompareSelection(compareSelection.filter(id => id !== item.id));
                                } else if (compareSelection.length < 2) {
                                  setCompareSelection([...compareSelection, item.id]);
                                }
                              }}
                              className={cn(
                                "group bg-white rounded-2xl border overflow-hidden transition-all cursor-pointer relative",
                                isSelected ? "border-primary-500 ring-2 ring-primary-500/20 shadow-lg" : "border-charcoal-200 hover:border-charcoal-300"
                              )}
                            >
                              <div className="aspect-video relative bg-charcoal-100">
                                <img 
                                  src={imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-xs font-bold text-white uppercase tracking-widest">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </div>
                                {isSelected && (
                                  <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                                    <div className="bg-primary-500 text-white p-2 rounded-full shadow-lg">
                                      <Check size={24} />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h4 className="font-bold text-charcoal-900 text-sm mb-1">{item.name || 'Captura Clínica'}</h4>
                                <p className="text-xs text-charcoal-600">Clique para selecionar</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {history.map((item) => {
                      const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/captures/${item.storage_path}`;
                      return (
                        <div key={item.id} className="group bg-white rounded-2xl border border-charcoal-200 overflow-hidden hover:shadow-lg transition-all">
                          <div className="aspect-video relative bg-charcoal-100">
                            <img 
                              src={imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-xs font-bold text-white uppercase tracking-widest">
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                            
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button 
                                onClick={() => setZoomImage(imageUrl)}
                                className="p-2.5 bg-white text-charcoal-900 rounded-xl font-bold text-xs hover:bg-charcoal-100 transition-all flex items-center gap-1.5 shadow-xl"
                                title="Visualizar"
                              >
                                <ZoomIn size={14} />
                                Zoom
                              </button>
                              <button 
                                onClick={() => setImageEditorUrl(imageUrl)}
                                className="p-2.5 bg-primary-500 text-white rounded-xl font-bold text-xs hover:bg-primary-600 transition-all flex items-center gap-1.5 shadow-xl"
                                title="Editar Imagem"
                              >
                                <Edit3 size={14} />
                                Editar
                              </button>
                              <button 
                                onClick={() => setEditingCapture({
                                  id: item.id,
                                  name: item.name || 'Captura Clínica',
                                  notes: item.notes || '',
                                  timestamp: new Date(item.created_at).getTime(),
                                  blob: new Blob(), // Placeholder as it's in cloud
                                  sync_status: 'synced'
                                })}
                                className="p-2.5 bg-white text-charcoal-600 rounded-xl font-bold text-xs hover:bg-charcoal-100 transition-all flex items-center gap-1.5 shadow-xl border border-charcoal-200"
                                title="Editar Metadados"
                              >
                                <Settings2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-charcoal-900 text-sm mb-1">{item.name || 'Captura Clínica'}</h4>
                            {item.notes && (
                              <p className="text-xs text-charcoal-500 line-clamp-2 italic">"{item.notes}"</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-8 bg-white border-t border-charcoal-100">
                <div className="flex items-center justify-between text-charcoal-500 text-xs">
                  <p>Total de registros: <span className="font-bold text-charcoal-900">{history.length}</span></p>
                  <p>Armazenamento otimizado (1080p)</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in Overlay */}

      {/* Check-in Overlay */}

      {/* Check-in Overlay */}
      <AnimatePresence>
        {isCheckInOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-charcoal-900/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl"
            >
              <div className="p-8 border-b border-charcoal-100 bg-white/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-charcoal-900 tracking-tight">Identificação do atendimento</h2>
                    <p className="text-charcoal-500 text-sm">Selecione a unidade, o profissional e o paciente para registrar o atendimento.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCheckInOpen(false)}
                  className="p-2 hover:bg-charcoal-50 rounded-full text-charcoal-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {configError ? (
                <div className="p-12 flex flex-col items-center text-center gap-4">
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
                    <AlertCircle size={48} />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-charcoal-900 mb-2">Configuração Necessária</h3>
                    <p className="text-charcoal-500 text-sm leading-relaxed">
                      Para utilizar as funcionalidades de nuvem, você precisa configurar as credenciais do Supabase no menu de <strong>Settings</strong> do AI Studio.
                    </p>
                    <div className="mt-6 p-4 bg-white rounded-xl border border-charcoal-200 text-left">
                      <p className="text-xs font-bold text-charcoal-500 uppercase tracking-widest mb-2">Variáveis Requeridas:</p>
                      <code className="text-xs text-charcoal-600 block bg-white p-2 rounded border border-charcoal-100 mb-1">VITE_SUPABASE_URL</code>
                      <code className="text-xs text-charcoal-600 block bg-white p-2 rounded border border-charcoal-100">VITE_SUPABASE_ANON_KEY</code>
                    </div>
                  </div>
                </div>
              ) : isLoadingClinics && clinics.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 size={48} className="text-primary-500 animate-spin" />
                  <p className="text-charcoal-500 font-medium">Carregando unidades disponíveis...</p>
                </div>
              ) : (
                <>
                  <div className="p-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Clinic Selection */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest flex items-center gap-2">
                          <Building2 size={12} /> Unidade
                        </label>
                        <div className="relative">
                          <select 
                            className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium disabled:opacity-50"
                            disabled={isLoadingClinics}
                            value={selectedClinic?.id || ''}
                            onChange={(e) => setSelectedClinic(clinics.find(c => c.id === e.target.value) || null)}
                          >
                            <option value="">{isLoadingClinics ? 'Carregando unidades...' : 'Selecione a unidade...'}</option>
                            {clinics.map(c => (
                              <option key={c.id} value={c.id}>
                                {(c as any).unidade || (c as any).name || `Unidade ${c.id}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Dentist Selection */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest flex items-center gap-2">
                          <Stethoscope size={12} /> Dentista Executor
                        </label>
                        <div className="relative">
                          <select 
                            className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium disabled:opacity-50"
                            disabled={!selectedClinic || isLoadingDentists}
                            value={selectedDentist?.id || ''}
                            onChange={(e) => setSelectedDentist(dentists.find(d => d.id === e.target.value) || null)}
                          >
                            <option value="">{isLoadingDentists ? 'Carregando dentistas...' : 'Selecione o dentista...'}</option>
                            {dentists.map(d => (
                              <option key={d.id} value={d.id}>
                                {(d as any).nome_completo || (d as any).nome || (d as any).name || `Dentista ${d.id}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Patient Search */}
                    <AnimatePresence>
                      {selectedClinic && selectedDentist && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-2 relative"
                        >
                          <div className="h-[1px] bg-charcoal-100 my-4" />
                          
                          <label className="text-xs font-bold text-charcoal-500 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} /> Paciente
                          </label>
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" size={16} />
                            <input 
                              type="text"
                              className="w-full pl-12 pr-12 py-4 bg-white border border-charcoal-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-lg"
                              placeholder="Buscar por nome..."
                              value={patientSearch}
                              onChange={(e) => setPatientSearch(e.target.value)}
                            />
                          </div>

                          {/* Search Results */}
                          {patientSearch.length >= 3 && !selectedPatient && (
                            <div className="bg-white border border-charcoal-200 rounded-xl shadow-xl z-20 overflow-hidden mt-2">
                              {patients.length > 0 ? (
                                patients.map(p => (
                                  <button 
                                    key={p.id}
                                    className="w-full px-4 py-3 text-left hover:bg-white border-b border-charcoal-100 last:border-0 flex items-center justify-between group"
                                    onClick={() => {
                                      setSelectedPatient(p);
                                      setPatientSearch(p.name);
                                    }}
                                  >
                                    <span className="font-bold text-charcoal-700 group-hover:text-primary-600 transition-colors">
                                      {p.name}
                                    </span>
                                    <Check size={14} className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center text-charcoal-500 text-sm">
                                  Nenhum paciente encontrado
                                </div>
                              )}
                            </div>
                          )}

                          {selectedPatient && (
                            <div className="mt-2 p-3 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Check size={14} className="text-primary-500" />
                                <span className="text-sm font-bold text-primary-700">
                                  {selectedPatient.name}
                                </span>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedPatient(null);
                                  setPatientSearch('');
                                }}
                                className="text-primary-500 hover:text-primary-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="p-8 bg-charcoal-50 border-t border-charcoal-100 flex justify-end">
                    <button 
                      onClick={async () => {
                        await handleCheckIn();
                      }}
                      disabled={isCheckingIn || !selectedClinic || !selectedDentist || (!selectedPatient && patientSearch.length < 3)}
                      className="px-10 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-charcoal-200 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 transition-all flex items-center gap-2"
                    >
                      {isCheckingIn ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                      Cadastrar e Iniciar
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      )}

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-white/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
            onClick={() => setZoomImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-full max-h-full flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg border border-primary-100">
                    <Maximize2 size={20} className="text-primary-500" />
                  </div>
                  <span className="text-charcoal-900 font-bold text-sm uppercase tracking-widest">Visualização em Alta Definição</span>
                </div>
                <button 
                  onClick={() => setZoomImage(null)}
                  className="p-2 bg-charcoal-100 hover:bg-charcoal-200 rounded-full text-charcoal-600 transition-colors border border-charcoal-200"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Image Container */}
              <div className="relative group">
                <img 
                  src={zoomImage} 
                  alt="Zoom"
                  className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl object-contain ring-1 ring-charcoal-200"
                />
              </div>
              
              {/* Footer Buttons */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setImageEditorUrl(zoomImage);
                    setZoomImage(null);
                  }}
                  className="px-8 py-3 bg-primary-500 text-white rounded-full font-bold text-sm hover:bg-primary-600 transition-all shadow-xl flex items-center gap-2 shadow-primary-500/20"
                >
                  <Edit3 size={18} />
                  Editar Imagem
                </button>
                <button 
                  onClick={() => setZoomImage(null)}
                  className="px-8 py-3 bg-white text-charcoal-600 border border-charcoal-200 rounded-full font-bold text-sm hover:bg-white transition-all shadow-xl"
                >
                  Fechar Visualização
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal (Metadata) */}
      <AnimatePresence>
        {editingCapture && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCapture(null)}
              className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-charcoal-100 flex items-center justify-between bg-white/50">
                <h3 className="text-lg font-bold text-charcoal-900">Editar Metadados</h3>
                <button 
                  onClick={() => setEditingCapture(null)}
                  className="p-2 hover:bg-charcoal-200 rounded-full transition-colors"
                >
                  <X size={20} className="text-charcoal-500" />
                </button>
              </div>
 
              <div className="p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-charcoal-400 uppercase tracking-widest">Nome da Captura</label>
                  <input 
                    type="text"
                    value={editingCapture.name}
                    onChange={(e) => setEditingCapture({ ...editingCapture, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                    placeholder="Digite o nome..."
                  />
                </div>
 
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-charcoal-400 uppercase tracking-widest">Notas / Observações</label>
                  <textarea 
                    rows={4}
                    value={editingCapture.notes}
                    onChange={(e) => setEditingCapture({ ...editingCapture, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium resize-none"
                    placeholder="Adicione observações técnicas..."
                  />
                </div>
 
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setEditingCapture(null)}
                    className="flex-1 py-3 bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700 rounded-xl font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleUpdate(editingCapture)}
                    className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Editor Modal */}
      <AnimatePresence>
        {imageEditorUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[650] bg-charcoal-900/95 backdrop-blur-md flex items-center justify-center p-0 md:p-2"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full h-full md:h-[98vh] md:max-w-[98vw] bg-white md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-3 md:p-4 border-b border-charcoal-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-500 p-1.5 rounded-xl text-white">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-bold text-charcoal-900 tracking-tight">Editor de Marcações</h2>
                    <p className="text-charcoal-500 text-[10px] uppercase font-bold tracking-widest">Enriquecimento de Diagnóstico</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setImageEditorUrl(null)}
                    className="px-4 py-2 text-charcoal-500 hover:text-charcoal-700 font-bold text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveEdition}
                    className="px-6 py-2 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2"
                  >
                    <Save size={18} />
                    Salvar Edição
                  </button>
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden bg-white">
                {/* Floating Action Sidebar (Left) */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 bg-white/80 backdrop-blur-md border border-charcoal-200 rounded-2xl flex flex-col items-center py-4 gap-4 shadow-xl">
                  {/* Color Palette in Sidebar */}
                  <div className="flex flex-col gap-1.5 p-1 bg-white rounded-xl border border-charcoal-100 shadow-sm">
                    {['#ef4444', '#1DB954', '#00C2A8', '#eab308', '#ffffff', '#000000'].map(color => (
                      <button
                        key={color}
                        onClick={() => setActiveEditorColor(color)}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-all flex-shrink-0",
                          activeEditorColor === color ? "border-primary-500 scale-110 shadow-md" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                        title={`Cor: ${color}`}
                      />
                    ))}
                  </div>

                  <div className="w-8 h-[1px] bg-charcoal-100" />

                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setActiveEditorTool('select')}
                      className={cn(
                        "p-2.5 rounded-xl transition-all",
                        activeEditorTool === 'select' ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-charcoal-400 hover:bg-charcoal-200"
                      )}
                      title="Selecionar (V)"
                    >
                      <MousePointer2 size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        setActiveEditorTool('rect');
                      }}
                      className={cn(
                        "p-2.5 rounded-xl transition-all",
                        activeEditorTool === 'rect' ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-charcoal-400 hover:bg-charcoal-200"
                      )}
                      title="Retângulo (R)"
                    >
                      <Layers size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        setActiveEditorTool('circle');
                      }}
                      className={cn(
                        "p-2.5 rounded-xl transition-all",
                        activeEditorTool === 'circle' ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-charcoal-400 hover:bg-charcoal-200"
                      )}
                      title="Círculo (C)"
                    >
                      <Circle size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        setActiveEditorTool('arrow');
                      }}
                      className={cn(
                        "p-2.5 rounded-xl transition-all",
                        activeEditorTool === 'arrow' ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-charcoal-400 hover:bg-charcoal-200"
                      )}
                      title="Seta (A)"
                    >
                      <ArrowUpRight size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        setActiveEditorTool('text');
                      }}
                      className={cn(
                        "p-2.5 rounded-xl transition-all",
                        activeEditorTool === 'text' ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-charcoal-400 hover:bg-charcoal-200"
                      )}
                      title="Texto (T)"
                    >
                      <Type size={20} />
                    </button>
                    <button 
                      onClick={() => setActiveEditorTool('pan')}
                      className={cn(
                        "p-2.5 rounded-xl transition-all",
                        activeEditorTool === 'pan' ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-charcoal-400 hover:bg-charcoal-200"
                      )}
                      title="Mover (H)"
                    >
                      <Hand size={20} />
                    </button>
                  </div>

                  <div className="w-8 h-[1px] bg-charcoal-100" />

                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleUndo}
                      className="p-2.5 rounded-xl text-charcoal-400 hover:bg-charcoal-200 transition-all"
                      title="Desfazer (Ctrl+Z)"
                    >
                      <Undo size={20} />
                    </button>
                    <button 
                      onClick={handleClearAll}
                      className="p-2.5 rounded-xl text-charcoal-400 hover:bg-charcoal-200 transition-all"
                      title="Limpar Tudo"
                    >
                      <RotateCcw size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        const canvas = fabricCanvasRef.current;
                        if (canvas) {
                          const active = canvas.getActiveObject();
                          if (active) {
                            canvas.remove(active);
                            canvas.requestRenderAll();
                          }
                        }
                      }}
                      className="p-2.5 rounded-xl text-charcoal-400 hover:bg-red-50 hover:text-red-500 transition-all"
                      title="Excluir (Del)"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Floating Adjustment Sidebar (Right) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-64 bg-white/80 backdrop-blur-md border border-charcoal-200 rounded-2xl p-4 shadow-xl flex flex-col gap-6">
                  <h3 className="text-[10px] font-bold text-charcoal-900 uppercase tracking-widest border-b border-charcoal-100 pb-2">Ajustes de Imagem</h3>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-charcoal-600">Espessura</span>
                        <span className="text-[10px] font-mono text-charcoal-400">{strokeWidth}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={strokeWidth} 
                        onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-charcoal-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-charcoal-600">Linha Tracejada</span>
                      <button 
                        onClick={() => setIsDashed(!isDashed)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-all relative",
                          isDashed ? "bg-primary-500" : "bg-charcoal-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                          isDashed ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>

                    <div className="w-full h-[1px] bg-charcoal-100 my-2" />

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-charcoal-600">
                          <Sun size={14} />
                          <span className="text-[10px] font-bold uppercase">Brilho</span>
                        </div>
                        <span className="text-[10px] font-mono text-charcoal-400">{brightness}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        value={brightness} 
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-charcoal-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-charcoal-600">
                          <Contrast size={14} />
                          <span className="text-[10px] font-bold uppercase">Contraste</span>
                        </div>
                        <span className="text-[10px] font-mono text-charcoal-400">{contrast}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        value={contrast} 
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-charcoal-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-charcoal-600">
                          <Droplets size={14} />
                          <span className="text-[10px] font-bold uppercase">Saturação</span>
                        </div>
                        <span className="text-[10px] font-mono text-charcoal-400">{saturation}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        value={saturation} 
                        onChange={(e) => setSaturation(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-charcoal-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setBrightness(0);
                      setContrast(0);
                      setSaturation(0);
                    }}
                    className="mt-2 py-2 bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-600 rounded-xl text-[10px] font-bold uppercase transition-all"
                  >
                    Resetar Ajustes
                  </button>
                </div>

                {/* Canvas Area */}
                <div className="absolute inset-0 flex items-center justify-center overflow-auto p-8 bg-charcoal-50/50">
                  <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden">
                    <canvas ref={editorCanvasElementRef} />
                  </div>
                </div>

                {/* Bottom Status Bar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-6 py-2 bg-white/80 backdrop-blur-md border border-charcoal-200 rounded-full shadow-xl flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-charcoal-600 uppercase tracking-widest">Modo Edição Ativo</span>
                  </div>
                  <div className="h-4 w-[1px] bg-charcoal-200" />
                  <div className="flex items-center gap-4 text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">
                    <span>Ferramenta: {activeEditorTool}</span>
                    <span>Cor: {activeEditorColor}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
