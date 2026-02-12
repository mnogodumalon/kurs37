import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  ClipboardList,
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  Euro,
  Calendar,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import {
  LivingAppsService,
  extractRecordId,
  createRecordUrl,
} from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type {
  Dozenten,
  Teilnehmer,
  Raeume,
  Kurse,
  Anmeldungen,
} from '@/types/app';

type TabValue = 'kurse' | 'dozenten' | 'teilnehmer' | 'raeume' | 'anmeldungen';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>('kurse');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: TabValue } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [kursForm, setKursForm] = useState({
    titel: '',
    beschreibung: '',
    startdatum: '',
    enddatum: '',
    max_teilnehmer: '',
    preis: '',
    dozent: '',
    raum: '',
  });
  const [dozentForm, setDozentForm] = useState({
    name: '',
    email: '',
    telefon: '',
    fachgebiet: '',
  });
  const [teilnehmerForm, setTeilnehmerForm] = useState({
    name: '',
    email: '',
    telefon: '',
    geburtsdatum: '',
  });
  const [raumForm, setRaumForm] = useState({
    raumname: '',
    gebaeude: '',
    kapazitaet: '',
  });
  const [anmeldungForm, setAnmeldungForm] = useState({
    teilnehmer: '',
    kurs: '',
    anmeldedatum: '',
    bezahlt: false,
  });

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [k, d, t, r, a] = await Promise.all([
        LivingAppsService.getKurse(),
        LivingAppsService.getDozenten(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setKurse(k);
      setDozenten(d);
      setTeilnehmer(t);
      setRaeume(r);
      setAnmeldungen(a);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date();
    const activeKurse = kurse.filter((k) => {
      if (!k.fields.startdatum || !k.fields.enddatum) return false;
      const start = new Date(k.fields.startdatum);
      const end = new Date(k.fields.enddatum);
      return start <= today && end >= today;
    });

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const anmeldungenThisMonth = anmeldungen.filter((a) => {
      if (!a.fields.anmeldedatum) return false;
      return new Date(a.fields.anmeldedatum) >= thisMonth;
    });

    const totalCapacity = kurse.reduce(
      (sum, k) => sum + (k.fields.max_teilnehmer || 0),
      0
    );
    const auslastung = totalCapacity > 0 ? Math.round((anmeldungen.length / totalCapacity) * 100) : 0;

    return {
      activeKurse: activeKurse.length,
      totalTeilnehmer: teilnehmer.length,
      anmeldungenThisMonth: anmeldungenThisMonth.length,
      auslastung,
    };
  }, [kurse, teilnehmer, anmeldungen]);

  // Helper functions
  const getDozentName = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const dozent = dozenten.find((d) => d.record_id === id);
    return dozent?.fields.name || '-';
  };

  const getRaumName = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const raum = raeume.find((r) => r.record_id === id);
    return raum ? `${raum.fields.raumname} (${raum.fields.gebaeude || '-'})` : '-';
  };

  const getTeilnehmerName = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const t = teilnehmer.find((tn) => tn.record_id === id);
    return t?.fields.name || '-';
  };

  const getKursTitel = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const k = kurse.find((ks) => ks.record_id === id);
    return k?.fields.titel || '-';
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd.MM.yyyy', { locale: de });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // CRUD operations
  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingId(null);
    resetForms();
    setDialogOpen(true);
  };

  const openEditDialog = (type: TabValue, item: Kurse | Dozenten | Teilnehmer | Raeume | Anmeldungen) => {
    setDialogMode('edit');
    setEditingId(item.record_id);
    setActiveTab(type);

    switch (type) {
      case 'kurse': {
        const k = item as Kurse;
        setKursForm({
          titel: k.fields.titel || '',
          beschreibung: k.fields.beschreibung || '',
          startdatum: k.fields.startdatum || '',
          enddatum: k.fields.enddatum || '',
          max_teilnehmer: k.fields.max_teilnehmer?.toString() || '',
          preis: k.fields.preis?.toString() || '',
          dozent: extractRecordId(k.fields.dozent) || '',
          raum: extractRecordId(k.fields.raum) || '',
        });
        break;
      }
      case 'dozenten': {
        const d = item as Dozenten;
        setDozentForm({
          name: d.fields.name || '',
          email: d.fields.email || '',
          telefon: d.fields.telefon || '',
          fachgebiet: d.fields.fachgebiet || '',
        });
        break;
      }
      case 'teilnehmer': {
        const t = item as Teilnehmer;
        setTeilnehmerForm({
          name: t.fields.name || '',
          email: t.fields.email || '',
          telefon: t.fields.telefon || '',
          geburtsdatum: t.fields.geburtsdatum || '',
        });
        break;
      }
      case 'raeume': {
        const r = item as Raeume;
        setRaumForm({
          raumname: r.fields.raumname || '',
          gebaeude: r.fields.gebaeude || '',
          kapazitaet: r.fields.kapazitaet?.toString() || '',
        });
        break;
      }
      case 'anmeldungen': {
        const a = item as Anmeldungen;
        setAnmeldungForm({
          teilnehmer: extractRecordId(a.fields.teilnehmer) || '',
          kurs: extractRecordId(a.fields.kurs) || '',
          anmeldedatum: a.fields.anmeldedatum || '',
          bezahlt: a.fields.bezahlt || false,
        });
        break;
      }
    }
    setDialogOpen(true);
  };

  const resetForms = () => {
    setKursForm({
      titel: '',
      beschreibung: '',
      startdatum: '',
      enddatum: '',
      max_teilnehmer: '',
      preis: '',
      dozent: '',
      raum: '',
    });
    setDozentForm({ name: '', email: '', telefon: '', fachgebiet: '' });
    setTeilnehmerForm({ name: '', email: '', telefon: '', geburtsdatum: '' });
    setRaumForm({ raumname: '', gebaeude: '', kapazitaet: '' });
    setAnmeldungForm({
      teilnehmer: '',
      kurs: '',
      anmeldedatum: format(new Date(), 'yyyy-MM-dd'),
      bezahlt: false,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      switch (activeTab) {
        case 'kurse': {
          const data = {
            titel: kursForm.titel,
            beschreibung: kursForm.beschreibung || undefined,
            startdatum: kursForm.startdatum,
            enddatum: kursForm.enddatum,
            max_teilnehmer: kursForm.max_teilnehmer ? Number(kursForm.max_teilnehmer) : undefined,
            preis: kursForm.preis ? Number(kursForm.preis) : undefined,
            dozent: kursForm.dozent ? createRecordUrl(APP_IDS.DOZENTEN, kursForm.dozent) : undefined,
            raum: kursForm.raum ? createRecordUrl(APP_IDS.RAEUME, kursForm.raum) : undefined,
          };
          if (dialogMode === 'create') {
            await LivingAppsService.createKurseEntry(data);
          } else if (editingId) {
            await LivingAppsService.updateKurseEntry(editingId, data);
          }
          setKurse(await LivingAppsService.getKurse());
          break;
        }
        case 'dozenten': {
          const data = {
            name: dozentForm.name,
            email: dozentForm.email,
            telefon: dozentForm.telefon || undefined,
            fachgebiet: dozentForm.fachgebiet || undefined,
          };
          if (dialogMode === 'create') {
            await LivingAppsService.createDozentenEntry(data);
          } else if (editingId) {
            await LivingAppsService.updateDozentenEntry(editingId, data);
          }
          setDozenten(await LivingAppsService.getDozenten());
          break;
        }
        case 'teilnehmer': {
          const data = {
            name: teilnehmerForm.name,
            email: teilnehmerForm.email,
            telefon: teilnehmerForm.telefon || undefined,
            geburtsdatum: teilnehmerForm.geburtsdatum || undefined,
          };
          if (dialogMode === 'create') {
            await LivingAppsService.createTeilnehmerEntry(data);
          } else if (editingId) {
            await LivingAppsService.updateTeilnehmerEntry(editingId, data);
          }
          setTeilnehmer(await LivingAppsService.getTeilnehmer());
          break;
        }
        case 'raeume': {
          const data = {
            raumname: raumForm.raumname,
            gebaeude: raumForm.gebaeude || undefined,
            kapazitaet: raumForm.kapazitaet ? Number(raumForm.kapazitaet) : undefined,
          };
          if (dialogMode === 'create') {
            await LivingAppsService.createRaeumeEntry(data);
          } else if (editingId) {
            await LivingAppsService.updateRaeumeEntry(editingId, data);
          }
          setRaeume(await LivingAppsService.getRaeume());
          break;
        }
        case 'anmeldungen': {
          const data = {
            teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, anmeldungForm.teilnehmer),
            kurs: createRecordUrl(APP_IDS.KURSE, anmeldungForm.kurs),
            anmeldedatum: anmeldungForm.anmeldedatum,
            bezahlt: anmeldungForm.bezahlt,
          };
          if (dialogMode === 'create') {
            await LivingAppsService.createAnmeldungenEntry(data);
          } else if (editingId) {
            await LivingAppsService.updateAnmeldungenEntry(editingId, data);
          }
          setAnmeldungen(await LivingAppsService.getAnmeldungen());
          break;
        }
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string, type: TabValue) => {
    setDeletingItem({ id, type });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    try {
      switch (deletingItem.type) {
        case 'kurse':
          await LivingAppsService.deleteKurseEntry(deletingItem.id);
          setKurse(await LivingAppsService.getKurse());
          break;
        case 'dozenten':
          await LivingAppsService.deleteDozentenEntry(deletingItem.id);
          setDozenten(await LivingAppsService.getDozenten());
          break;
        case 'teilnehmer':
          await LivingAppsService.deleteTeilnehmerEntry(deletingItem.id);
          setTeilnehmer(await LivingAppsService.getTeilnehmer());
          break;
        case 'raeume':
          await LivingAppsService.deleteRaeumeEntry(deletingItem.id);
          setRaeume(await LivingAppsService.getRaeume());
          break;
        case 'anmeldungen':
          await LivingAppsService.deleteAnmeldungenEntry(deletingItem.id);
          setAnmeldungen(await LivingAppsService.getAnmeldungen());
          break;
      }
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleBezahlt = async (anmeldung: Anmeldungen) => {
    try {
      await LivingAppsService.updateAnmeldungenEntry(anmeldung.record_id, {
        bezahlt: !anmeldung.fields.bezahlt,
      });
      setAnmeldungen(await LivingAppsService.getAnmeldungen());
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  // Filter data based on search
  const filterData = <T extends { fields: Record<string, unknown> }>(
    data: T[],
    searchFields: (keyof T['fields'])[]
  ): T[] => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item.fields[field as string];
        return value && String(value).toLowerCase().includes(query);
      })
    );
  };

  const filteredKurse = filterData(kurse, ['titel', 'beschreibung']);
  const filteredDozenten = filterData(dozenten, ['name', 'email', 'fachgebiet']);
  const filteredTeilnehmer = filterData(teilnehmer, ['name', 'email']);
  const filteredRaeume = filterData(raeume, ['raumname', 'gebaeude']);
  const filteredAnmeldungen = anmeldungen.filter((a) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      getTeilnehmerName(a.fields.teilnehmer).toLowerCase().includes(query) ||
      getKursTitel(a.fields.kurs).toLowerCase().includes(query)
    );
  });

  const getDialogTitle = () => {
    const prefix = dialogMode === 'create' ? 'Neu: ' : 'Bearbeiten: ';
    const titles: Record<TabValue, string> = {
      kurse: 'Kurs',
      dozenten: 'Dozent',
      teilnehmer: 'Teilnehmer',
      raeume: 'Raum',
      anmeldungen: 'Anmeldung',
    };
    return prefix + titles[activeTab];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8 text-primary" />
          <p className="text-muted-foreground">Lade Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero px-6 py-8 text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="size-8" />
            <h1 className="text-2xl font-bold tracking-tight">Kursverwaltung</h1>
          </div>
          <p className="text-primary-foreground/80">
            Verwalten Sie Kurse, Dozenten, Teilnehmer und Anmeldungen
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-elevated border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeKurse}</p>
                  <p className="text-xs text-muted-foreground">Aktive Kurse</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-elevated border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <Users className="size-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTeilnehmer}</p>
                  <p className="text-xs text-muted-foreground">Teilnehmer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-elevated border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <ClipboardList className="size-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.anmeldungenThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Anm. diesen Monat</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-elevated border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Building2 className="size-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.auslastung}%</p>
                  <p className="text-xs text-muted-foreground">Auslastung</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TabValue);
            setSearchQuery('');
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="kurse" className="gap-2">
                <BookOpen className="size-4" />
                <span className="hidden sm:inline">Kurse</span>
              </TabsTrigger>
              <TabsTrigger value="dozenten" className="gap-2">
                <GraduationCap className="size-4" />
                <span className="hidden sm:inline">Dozenten</span>
              </TabsTrigger>
              <TabsTrigger value="teilnehmer" className="gap-2">
                <Users className="size-4" />
                <span className="hidden sm:inline">Teilnehmer</span>
              </TabsTrigger>
              <TabsTrigger value="raeume" className="gap-2">
                <Building2 className="size-4" />
                <span className="hidden sm:inline">Räume</span>
              </TabsTrigger>
              <TabsTrigger value="anmeldungen" className="gap-2">
                <ClipboardList className="size-4" />
                <span className="hidden sm:inline">Anmeldungen</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="gradient" onClick={openCreateDialog}>
                <Plus className="size-4" />
                <span className="hidden sm:inline">Neu</span>
              </Button>
            </div>
          </div>

          {/* Kurse Tab */}
          <TabsContent value="kurse">
            <Card className="shadow-card border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Kurse ({filteredKurse.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titel</TableHead>
                        <TableHead>Zeitraum</TableHead>
                        <TableHead>Dozent</TableHead>
                        <TableHead>Raum</TableHead>
                        <TableHead className="text-right">Max. TN</TableHead>
                        <TableHead className="text-right">Preis</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKurse.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Keine Kurse gefunden
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredKurse.map((kurs) => (
                          <TableRow key={kurs.record_id} className="group">
                            <TableCell className="font-medium">{kurs.fields.titel}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Calendar className="size-3.5 text-muted-foreground" />
                                {formatDate(kurs.fields.startdatum)} - {formatDate(kurs.fields.enddatum)}
                              </div>
                            </TableCell>
                            <TableCell>{getDozentName(kurs.fields.dozent)}</TableCell>
                            <TableCell>{getRaumName(kurs.fields.raum)}</TableCell>
                            <TableCell className="text-right">{kurs.fields.max_teilnehmer ?? '-'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(kurs.fields.preis)}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog('kurse', kurs)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => confirmDelete(kurs.record_id, 'kurse')}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dozenten Tab */}
          <TabsContent value="dozenten">
            <Card className="shadow-card border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Dozenten ({filteredDozenten.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Fachgebiet</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDozenten.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Keine Dozenten gefunden
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDozenten.map((dozent) => (
                          <TableRow key={dozent.record_id} className="group">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-primary/10">
                                  <User className="size-3.5 text-primary" />
                                </div>
                                {dozent.fields.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Mail className="size-3.5 text-muted-foreground" />
                                {dozent.fields.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              {dozent.fields.telefon ? (
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Phone className="size-3.5 text-muted-foreground" />
                                  {dozent.fields.telefon}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {dozent.fields.fachgebiet ? (
                                <Badge variant="secondary">{dozent.fields.fachgebiet}</Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog('dozenten', dozent)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => confirmDelete(dozent.record_id, 'dozenten')}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teilnehmer Tab */}
          <TabsContent value="teilnehmer">
            <Card className="shadow-card border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Teilnehmer ({filteredTeilnehmer.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Geburtsdatum</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeilnehmer.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Keine Teilnehmer gefunden
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTeilnehmer.map((tn) => (
                          <TableRow key={tn.record_id} className="group">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-chart-2/10">
                                  <User className="size-3.5 text-chart-2" />
                                </div>
                                {tn.fields.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Mail className="size-3.5 text-muted-foreground" />
                                {tn.fields.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              {tn.fields.telefon ? (
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Phone className="size-3.5 text-muted-foreground" />
                                  {tn.fields.telefon}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Calendar className="size-3.5 text-muted-foreground" />
                                {formatDate(tn.fields.geburtsdatum)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog('teilnehmer', tn)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => confirmDelete(tn.record_id, 'teilnehmer')}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Räume Tab */}
          <TabsContent value="raeume">
            <Card className="shadow-card border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Räume ({filteredRaeume.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Raumname</TableHead>
                        <TableHead>Gebäude</TableHead>
                        <TableHead className="text-right">Kapazität</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRaeume.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Keine Räume gefunden
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRaeume.map((raum) => (
                          <TableRow key={raum.record_id} className="group">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-warning/10">
                                  <Building2 className="size-3.5 text-warning" />
                                </div>
                                {raum.fields.raumname}
                              </div>
                            </TableCell>
                            <TableCell>{raum.fields.gebaeude || '-'}</TableCell>
                            <TableCell className="text-right">
                              {raum.fields.kapazitaet ? (
                                <Badge variant="outline">{raum.fields.kapazitaet} Plätze</Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog('raeume', raum)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => confirmDelete(raum.record_id, 'raeume')}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anmeldungen Tab */}
          <TabsContent value="anmeldungen">
            <Card className="shadow-card border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Anmeldungen ({filteredAnmeldungen.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teilnehmer</TableHead>
                        <TableHead>Kurs</TableHead>
                        <TableHead>Anmeldedatum</TableHead>
                        <TableHead className="text-center">Bezahlt</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnmeldungen.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Keine Anmeldungen gefunden
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAnmeldungen.map((anmeldung) => (
                          <TableRow key={anmeldung.record_id} className="group">
                            <TableCell className="font-medium">
                              {getTeilnehmerName(anmeldung.fields.teilnehmer)}
                            </TableCell>
                            <TableCell>{getKursTitel(anmeldung.fields.kurs)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Calendar className="size-3.5 text-muted-foreground" />
                                {formatDate(anmeldung.fields.anmeldedatum)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                onClick={() => toggleBezahlt(anmeldung)}
                                className="inline-flex items-center justify-center"
                              >
                                {anmeldung.fields.bezahlt ? (
                                  <Badge variant="success" className="gap-1 cursor-pointer hover:bg-success/80">
                                    <Check className="size-3" />
                                    Bezahlt
                                  </Badge>
                                ) : (
                                  <Badge variant="warning" className="gap-1 cursor-pointer hover:bg-warning/80">
                                    <Euro className="size-3" />
                                    Offen
                                  </Badge>
                                )}
                              </button>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog('anmeldungen', anmeldung)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => confirmDelete(anmeldung.record_id, 'anmeldungen')}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>

          {activeTab === 'kurse' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="titel">Titel *</Label>
                <Input
                  id="titel"
                  value={kursForm.titel}
                  onChange={(e) => setKursForm({ ...kursForm, titel: e.target.value })}
                  placeholder="z.B. Python Grundkurs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="beschreibung">Beschreibung</Label>
                <Textarea
                  id="beschreibung"
                  value={kursForm.beschreibung}
                  onChange={(e) => setKursForm({ ...kursForm, beschreibung: e.target.value })}
                  placeholder="Kursbeschreibung..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startdatum">Startdatum *</Label>
                  <Input
                    id="startdatum"
                    type="date"
                    value={kursForm.startdatum}
                    onChange={(e) => setKursForm({ ...kursForm, startdatum: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="enddatum">Enddatum *</Label>
                  <Input
                    id="enddatum"
                    type="date"
                    value={kursForm.enddatum}
                    onChange={(e) => setKursForm({ ...kursForm, enddatum: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="max_teilnehmer">Max. Teilnehmer</Label>
                  <Input
                    id="max_teilnehmer"
                    type="number"
                    value={kursForm.max_teilnehmer}
                    onChange={(e) => setKursForm({ ...kursForm, max_teilnehmer: e.target.value })}
                    placeholder="20"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preis">Preis (€)</Label>
                  <Input
                    id="preis"
                    type="number"
                    step="0.01"
                    value={kursForm.preis}
                    onChange={(e) => setKursForm({ ...kursForm, preis: e.target.value })}
                    placeholder="299.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dozent">Dozent</Label>
                  <Select
                    value={kursForm.dozent || 'none'}
                    onValueChange={(v) => setKursForm({ ...kursForm, dozent: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dozent auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Dozent</SelectItem>
                      {dozenten.map((d) => (
                        <SelectItem key={d.record_id} value={d.record_id}>
                          {d.fields.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="raum">Raum</Label>
                  <Select
                    value={kursForm.raum || 'none'}
                    onValueChange={(v) => setKursForm({ ...kursForm, raum: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Raum auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Raum</SelectItem>
                      {raeume.map((r) => (
                        <SelectItem key={r.record_id} value={r.record_id}>
                          {r.fields.raumname} ({r.fields.gebaeude || '-'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dozenten' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={dozentForm.name}
                  onChange={(e) => setDozentForm({ ...dozentForm, name: e.target.value })}
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={dozentForm.email}
                  onChange={(e) => setDozentForm({ ...dozentForm, email: e.target.value })}
                  placeholder="max@beispiel.de"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefon">Telefon</Label>
                <Input
                  id="telefon"
                  value={dozentForm.telefon}
                  onChange={(e) => setDozentForm({ ...dozentForm, telefon: e.target.value })}
                  placeholder="+49 123 456789"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fachgebiet">Fachgebiet</Label>
                <Input
                  id="fachgebiet"
                  value={dozentForm.fachgebiet}
                  onChange={(e) => setDozentForm({ ...dozentForm, fachgebiet: e.target.value })}
                  placeholder="z.B. Informatik, Marketing"
                />
              </div>
            </div>
          )}

          {activeTab === 'teilnehmer' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={teilnehmerForm.name}
                  onChange={(e) => setTeilnehmerForm({ ...teilnehmerForm, name: e.target.value })}
                  placeholder="Maria Musterfrau"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={teilnehmerForm.email}
                  onChange={(e) => setTeilnehmerForm({ ...teilnehmerForm, email: e.target.value })}
                  placeholder="maria@beispiel.de"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefon">Telefon</Label>
                <Input
                  id="telefon"
                  value={teilnehmerForm.telefon}
                  onChange={(e) => setTeilnehmerForm({ ...teilnehmerForm, telefon: e.target.value })}
                  placeholder="+49 123 456789"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                <Input
                  id="geburtsdatum"
                  type="date"
                  value={teilnehmerForm.geburtsdatum}
                  onChange={(e) => setTeilnehmerForm({ ...teilnehmerForm, geburtsdatum: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === 'raeume' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="raumname">Raumname *</Label>
                <Input
                  id="raumname"
                  value={raumForm.raumname}
                  onChange={(e) => setRaumForm({ ...raumForm, raumname: e.target.value })}
                  placeholder="z.B. Seminarraum A1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gebaeude">Gebäude</Label>
                <Input
                  id="gebaeude"
                  value={raumForm.gebaeude}
                  onChange={(e) => setRaumForm({ ...raumForm, gebaeude: e.target.value })}
                  placeholder="z.B. Hauptgebäude"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kapazitaet">Kapazität (Plätze)</Label>
                <Input
                  id="kapazitaet"
                  type="number"
                  value={raumForm.kapazitaet}
                  onChange={(e) => setRaumForm({ ...raumForm, kapazitaet: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
          )}

          {activeTab === 'anmeldungen' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="teilnehmer">Teilnehmer *</Label>
                <Select
                  value={anmeldungForm.teilnehmer || 'none'}
                  onValueChange={(v) => setAnmeldungForm({ ...anmeldungForm, teilnehmer: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Teilnehmer auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Auswählen...</SelectItem>
                    {teilnehmer.map((t) => (
                      <SelectItem key={t.record_id} value={t.record_id}>
                        {t.fields.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kurs">Kurs *</Label>
                <Select
                  value={anmeldungForm.kurs || 'none'}
                  onValueChange={(v) => setAnmeldungForm({ ...anmeldungForm, kurs: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kurs auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Auswählen...</SelectItem>
                    {kurse.map((k) => (
                      <SelectItem key={k.record_id} value={k.record_id}>
                        {k.fields.titel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="anmeldedatum">Anmeldedatum *</Label>
                <Input
                  id="anmeldedatum"
                  type="date"
                  value={anmeldungForm.anmeldedatum}
                  onChange={(e) => setAnmeldungForm({ ...anmeldungForm, anmeldedatum: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bezahlt"
                  checked={anmeldungForm.bezahlt}
                  onCheckedChange={(checked) =>
                    setAnmeldungForm({ ...anmeldungForm, bezahlt: checked === true })
                  }
                />
                <Label htmlFor="bezahlt" className="cursor-pointer">
                  Bezahlt
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button variant="gradient" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner className="size-4" /> : null}
              {dialogMode === 'create' ? 'Erstellen' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              Löschen bestätigen
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Möchten Sie diesen Eintrag wirklich löschen? Diese Aktion kann nicht
            rückgängig gemacht werden.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Spinner className="size-4" /> : <X className="size-4" />}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
