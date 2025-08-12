'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../site-contexts/UserContext';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../components/ui/card';
import React from 'react';

declare global {
    interface Window {
        shell: {
            ajaxSafePost(options: {
                type: string;
                url: string;
                data?: any;
            }): Promise<any>;
        };
    }
}

// --- INTERFACES ---
interface MergedService {
    id: string;
    subject: string;
    product: string;
    unit: string;
    minPrice: number;
    currentPrice: number | null;
    practitionerId: string | null;
}

interface AdditionalInfo {
    specialty: string;
    freeConsultation: boolean;
    consultationRate: number | string;
    hourlyRate: number | string;
}

interface ServicesByCategory {
    [key: string]: MergedService[];
}

// --- API Configuration ---
const API_URLS = {
    services: {
        powerpages: "/_api/cloudflow/v1.0/trigger/d5424eb1-8e30-f011-8c4e-002248ad99ee",
        local: "https://prod-26.canadacentral.logic.azure.com:443/workflows/91a41816ae464b9a945b11dde80bba0c/triggers/manual/paths/invoke?api-version=2016-06-01"
    },
    additionalInfo: {
        powerpages: "/_api/cloudflow/v1.0/trigger/7ec0661b-4c57-f011-bec2-6045bd619595",
        local: "https://prod-04.canadacentral.logic.azure.com:443/workflows/adc8a835237742bdb81f4819dccd78a7/triggers/manual/paths/invoke?api-version=2016-06-01"
    },
    serviceActions: {
        powerpages: "/_api/cloudflow/v1.0/trigger/7cd5601e-9330-f011-8c4e-6045bd5dca91",
        local: "https://prod-09.canadacentral.logic.azure.com:443/workflows/ee8ffb0eac5e4547b7121d86bc4dca76/triggers/manual/paths/invoke?api-version=2016-06-01"
    }
};

const LOCAL_DEV_USER_ID = "c2c2de7e-8968-f011-bec3-6045bd619595";
const isLocalDevelopment = typeof window.shell === 'undefined';

export default function PractitionerServicesForm({
    onDataLoaded,
    onTabChange,
    activeTab,
    showTitle = true,
    // Controlled mode props
    additionalInfo: controlledAdditionalInfo,
    onAdditionalInfoChange,
    onSaveGeneralInfo,
    isGeneralSaving: controlledIsGeneralSaving
}: {
    onDataLoaded?: (tabNames: string[]) => void;
    onTabChange?: (tabName: string) => void;
    activeTab?: string;
    showTitle?: boolean;
    additionalInfo?: AdditionalInfo;
    onAdditionalInfoChange?: (field: keyof AdditionalInfo, value: any) => void;
    onSaveGeneralInfo?: () => Promise<boolean>;
    isGeneralSaving?: boolean;
}) {
    // --- Internal state for uncontrolled mode ---
    const [internalAdditionalInfo, setInternalAdditionalInfo] = useState<AdditionalInfo>({
        specialty: '',
        freeConsultation: false,
        consultationRate: '',
        hourlyRate: '',
    });
    const [internalIsGeneralSaving, setInternalIsGeneralSaving] = useState(false);

    // Determine mode
    const isControlled = controlledAdditionalInfo !== undefined;
    const additionalInfo = isControlled ? controlledAdditionalInfo : internalAdditionalInfo;
    const isGeneralSaving = isControlled ? controlledIsGeneralSaving : internalIsGeneralSaving;

    const handleInfoInputChange = (field: keyof AdditionalInfo, value: string | boolean) => {
        if (isControlled && onAdditionalInfoChange) {
            onAdditionalInfoChange(field, value);
        } else {
            setInternalAdditionalInfo(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleInternalSave = async (): Promise<boolean> => {
        if (!additionalInfo.specialty.trim() || !additionalInfo.consultationRate || !additionalInfo.hourlyRate) {
            toast.error("Please fill all required General Information fields.");
            return false;
        }
        setInternalIsGeneralSaving(true);
        const payload = {
            reason: 'update',
            specialty: additionalInfo.specialty,
            freeconsultation: additionalInfo.freeConsultation,
            consultationrate: parseFloat(String(additionalInfo.consultationRate)),
            hourlyrate: parseFloat(String(additionalInfo.hourlyRate))
        };
        try {
            if (isLocalDevelopment) {
                const tokenResponse = await fetch('http://localhost:3001/api/get-token', { method: 'POST' });
                const { accessToken } = await tokenResponse.json();
                if (!accessToken) throw new Error("Could not retrieve access token.");

                const localPayload = { ...payload, userid: LOCAL_DEV_USER_ID };
                await fetch(API_URLS.additionalInfo.local, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(localPayload)
                });
            } else {
                await window.shell.ajaxSafePost({ type: 'POST', url: API_URLS.additionalInfo.powerpages, data: { eventData: JSON.stringify(payload) } });
            }
            toast.success("General information has been saved successfully!");
            return true;
        } catch (error) {
            console.error("Error saving general info:", error);
            toast.error("Failed to save general information.");
            return false;
        } finally {
            setInternalIsGeneralSaving(false);
        }
    };

    const handleSaveAdditionalInfo = isControlled ? onSaveGeneralInfo : handleInternalSave;

    // --- Other states ---
    const [isLoading, setIsLoading] = useState(true);
    const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({});
    const { setUser } = useUser();
    const hasFetched = useRef(false);
    const [servicesByCategory, setServicesByCategory] = useState<ServicesByCategory>({});
    const [newPrices, setNewPrices] = useState<{ [key: string]: string }>({});
    const categoryOrder = [
        'Permanent Residency Services',
        'Temporary Immigration Services',
        'Other Immigration Services'
    ];

    const processServiceData = useCallback((data: any) => {
        if (data.firstname && data.lastname) {
            const imageUrl = data.profileimage ? `data:image/png;base64,${data.profileimage}` : '/default-avatar.png';
            setUser({
                firstName: data.firstname,
                lastName: data.lastname,
                profileImage: imageUrl,
            });
        }

        const practitionerServices = data.practitioner || [];
        const bestVisaServices = data.bestvisa || [];
        const groupedServices: ServicesByCategory = {};

        bestVisaServices.forEach((service: any) => {
            const category = service.subject;
            if (!groupedServices[category]) {
                groupedServices[category] = [];
            }
            const practitionerService = practitionerServices.find((ps: any) => ps.product === service.product && ps.subject === service.subject);
            const mergedService: MergedService = {
                id: service.id,
                subject: service.subject,
                product: service.product,
                unit: service.unit,
                minPrice: parseFloat(service.price),
                currentPrice: practitionerService ? parseFloat(practitionerService.price) : null,
                practitionerId: practitionerService ? practitionerService.id : null,
            };
            groupedServices[category].push(mergedService);

            if (mergedService.currentPrice !== null) {
                setNewPrices(prev => ({ ...prev, [mergedService.id]: String(mergedService.currentPrice) }));
            } else {
                setNewPrices(prev => ({ ...prev, [mergedService.id]: String(mergedService.minPrice) }));
            }
        });

        for (const category in groupedServices) {
            groupedServices[category].sort((a, b) => a.product.localeCompare(b.product));
        }

        setServicesByCategory(groupedServices);
        if (onDataLoaded) {
            const tabNames = ['general', ...categoryOrder.filter(cat => groupedServices[cat])];
            onDataLoaded(tabNames);
        }
    }, [setUser, onDataLoaded]);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (isLocalDevelopment) {
                const tokenResponse = await fetch('http://localhost:3001/api/get-token', { method: 'POST' });
                const { accessToken } = await tokenResponse.json();
                if (!accessToken) throw new Error("Could not retrieve access token.");
                const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

                const servicesResponse = await fetch(API_URLS.services.local, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ userid: LOCAL_DEV_USER_ID })
                });
                const servicesData = await servicesResponse.json();
                processServiceData(servicesData);

                // This block now ONLY runs when the component is in "uncontrolled" (standalone) mode
                if (!isControlled) {
                    const infoResponse = await fetch(API_URLS.additionalInfo.local, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ reason: 'get', userid: LOCAL_DEV_USER_ID })
                    });
                    const infoData = await infoResponse.json();
                    if (infoData.message === 'success' && infoData.additionalinfo) {
                        setInternalAdditionalInfo({
                            specialty: infoData.additionalinfo.specialty || '',
                            freeConsultation: infoData.additionalinfo.freeconsultation === 'True' || infoData.additionalinfo.freeconsultation === true,
                            consultationRate: infoData.additionalinfo.consultationrate || '',
                            hourlyRate: infoData.additionalinfo.hourlyrate || '',
                        });
                    }
                }
            } else { // Power Pages Environment
                const servicesResponse = await window.shell.ajaxSafePost({ type: 'POST', url: API_URLS.services.powerpages, data: { eventData: JSON.stringify({}) } });
                processServiceData(JSON.parse(servicesResponse));

                // This block now ONLY runs when the component is in "uncontrolled" (standalone) mode
                if (!isControlled) {
                    const infoPayload = {
                        "reason": "get",
                        "specialty": "",
                        "freeconsultation": false,
                        "consultationrate": 0,
                        "hourlyrate": 0
                    };
                    const infoResponse = await window.shell.ajaxSafePost({ type: 'POST', url: API_URLS.additionalInfo.powerpages, data: { eventData: JSON.stringify(infoPayload) } });
                    const infoData = JSON.parse(infoResponse);
                    if (infoData.message === 'success' && infoData.additionalinfo) {
                        setInternalAdditionalInfo({
                            specialty: infoData.additionalinfo.specialty || '',
                            freeConsultation: infoData.additionalinfo.freeconsultation === 'True',
                            consultationRate: infoData.additionalinfo.consultationrate || '',
                            hourlyRate: infoData.additionalinfo.hourlyrate || '',
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load your services data. Please refresh the page.");
        } finally {
            setIsLoading(false);
        }
    }, [processServiceData, isControlled]); // isControlled is now a dependency

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchAllData();
        }
    }, [fetchAllData]);

    const handlePriceInputChange = (serviceId: string, value: string) => {
        setNewPrices(prev => ({ ...prev, [serviceId]: value }));
    };

    const handleServiceAction = async (mode: 'new' | 'update' | 'delete', service: MergedService, categoryName: string) => {
        const serviceId = service.id;
        const price = parseFloat(newPrices[serviceId]);

        if (mode !== 'delete' && (isNaN(price) || price < service.minPrice)) {
            toast.error(`Price cannot be less than the minimum of $${service.minPrice.toFixed(2)}.`);
            return;
        }

        setSavingStates(prev => ({ ...prev, [serviceId]: true }));
        const originalServices = JSON.parse(JSON.stringify(servicesByCategory));
        const updatedServices = JSON.parse(JSON.stringify(servicesByCategory));
        const serviceToUpdate = updatedServices[categoryName].find((s: MergedService) => s.id === serviceId);

        if (!serviceToUpdate) return;

        switch (mode) {
            case 'new':
            case 'update':
                serviceToUpdate.currentPrice = price;
                break;
            case 'delete':
                serviceToUpdate.currentPrice = null;
                serviceToUpdate.practitionerId = null;
                break;
        }
        setServicesByCategory(updatedServices);

        const payload = {
            mode,
            prid: mode === 'new' ? service.id : service.practitionerId,
            price: String(price)
        };

        try {
            let responseData: any;
            if (isLocalDevelopment) {
                const tokenResponse = await fetch('http://localhost:3001/api/get-token', { method: 'POST' });
                const { accessToken } = await tokenResponse.json();
                if (!accessToken) throw new Error("Could not retrieve access token.");

                const localPayload = { ...payload, userid: LOCAL_DEV_USER_ID };
                const res = await fetch(API_URLS.serviceActions.local, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(localPayload)
                });
                responseData = await res.json();
            } else {
                const res = await window.shell.ajaxSafePost({ type: 'POST', url: API_URLS.serviceActions.powerpages, data: { eventData: JSON.stringify(payload) } });
                responseData = JSON.parse(res);
            }

            toast.success(`Service ${mode === 'new' ? 'added' : mode === 'update' ? 'updated' : 'removed'} successfully!`);

            if (mode === 'new' && responseData.newId) {
                setServicesByCategory(currentServices => {
                    const finalServices = JSON.parse(JSON.stringify(currentServices));
                    const finalServiceToUpdate = finalServices[categoryName].find((s: MergedService) => s.id === serviceId);
                    if (finalServiceToUpdate) {
                        finalServiceToUpdate.practitionerId = responseData.newId;
                    }
                    return finalServices;
                });
            }
        } catch (error) {
            console.error(`Error during service action (${mode}):`, error);
            toast.error(`Failed to ${mode} service. Reverting changes.`);
            setServicesByCategory(originalServices);
        } finally {
            setSavingStates(prev => ({ ...prev, [serviceId]: false }));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-12 h-12 animate-spin text-[#a4262c]" />
            </div>
        );
    }

    return (
        <div className="relative">
            {showTitle && (
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#011d41' }}>
                        Manage your Services and Prices
                    </h1>
                    <p className="text-sm text-gray-600 mt-2">
                        <strong>Notice:</strong> Service details and pricing are used internally for matching and offer generation; they are not visible to clients and can be adjusted before sending an offer.
                    </p>
                </div>
            )}
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <div className="relative w-full overflow-x-auto">
                    <TabsList className="h-auto flex-wrap justify-start border-b border-gray-200">
                        {['general', ...categoryOrder]
                            .filter(tabValue => tabValue === 'general' || servicesByCategory[tabValue])
                            .map((tabValue, index, arr) => (
                                <React.Fragment key={tabValue}>
                                    <TabsTrigger
                                        value={tabValue}
                                        className="data-[state=active]:bg-[#a4262c] data-[state=active]:text-white"
                                    >
                                        {tabValue === 'general' ? 'General' : tabValue}
                                    </TabsTrigger>
                                    {index < arr.length - 1 && (
                                        <span className="hidden md:inline-block mx-2 text-gray-300">|</span>
                                    )}
                                </React.Fragment>
                            ))}
                    </TabsList>
                </div>

                <TabsContent value="general">
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>
                                Set your general service rates and specialties. This information will be visible on your public profile.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="specialty">Specialty (Top 3 Services)</Label>
                                <Input id="specialty" placeholder="e.g., Visitor Visa, Citizenship, Work Permit" value={additionalInfo.specialty} onChange={e => handleInfoInputChange('specialty', e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="hourly-rate">Hourly Service Fee (CAD)</Label>
                                    <Input id="hourly-rate" type="number" min="0" placeholder="Enter hourly rate for representing clients" value={additionalInfo.hourlyRate} onChange={e => handleInfoInputChange('hourlyRate', e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="consultation-rate">Hourly Consultation Fee (CAD)</Label>
                                    <Input id="consultation-rate" type="number" min="0" placeholder="Enter your hourly consultation rate" value={additionalInfo.consultationRate} onChange={e => handleInfoInputChange('consultationRate', e.target.value)} required />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="free-consultation"
                                    checked={additionalInfo.freeConsultation}
                                    onCheckedChange={checked => handleInfoInputChange('freeConsultation', !!checked)}
                                    className="data-[state=checked]:bg-[#a4262c] data-[state=checked]:border-[#a4262c]"
                                />
                                <Label htmlFor="free-consultation" className="font-medium">Accepts One-Time Free Consultation</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveAdditionalInfo} disabled={isGeneralSaving}>
                                {isGeneralSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save General Information'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {categoryOrder.map(category =>
                    servicesByCategory[category] && (
                        <TabsContent key={category} value={category}>
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle>{category}</CardTitle>
                                    <CardDescription>Set your prices for the services below. You must offer a price greater than or equal to the minimum.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[30%] min-w-[250px] max-w-[400px]">Service Name</TableHead>
                                                    <TableHead>Unit</TableHead>
                                                    <TableHead>Minimum Price</TableHead>
                                                    <TableHead>Your Price</TableHead>
                                                    <TableHead>New Price</TableHead>
                                                    <TableHead
                                                        className="sticky right-0 p-4 w-[150px] md:w-[210px] text-right backdrop-blur-sm"
                                                        style={{ backgroundColor: 'rgba(239, 239, 239, 0.85)' }}
                                                    >
                                                        Action
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {servicesByCategory[category].map(service => {
                                                    const isRowSaving = savingStates[service.id];
                                                    return (
                                                        <TableRow key={service.id}>
                                                            <TableCell className="font-medium whitespace-normal">{service.product}</TableCell>
                                                            <TableCell>{service.unit}</TableCell>
                                                            <TableCell>${service.minPrice.toFixed(2)}</TableCell>
                                                            <TableCell className="font-semibold" style={{ color: '#011d41' }}>
                                                                {service.currentPrice !== null ? `$${service.currentPrice.toFixed(2)}` : 'Not Added'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    className="w-28"
                                                                    placeholder={service.minPrice.toFixed(2)}
                                                                    min={service.minPrice}
                                                                    step="0.01"
                                                                    value={newPrices[service.id] || ''}
                                                                    onChange={(e) => handlePriceInputChange(service.id, e.target.value)}
                                                                    disabled={isRowSaving}
                                                                />
                                                            </TableCell>
                                                            <TableCell
                                                                className="sticky right-0 p-4 text-right backdrop-blur"
                                                                style={{ backgroundColor: 'rgba(239, 239, 239, 0.8)' }}
                                                            >
                                                                <div className="flex justify-end items-center space-x-2">
                                                                    {service.currentPrice !== null ? (
                                                                        <>
                                                                            <Button variant="outline" size="icon" className="h-8 w-8 md:h-auto md:w-auto md:px-3 md:py-2" onClick={() => handleServiceAction('update', service, category)} disabled={isRowSaving}>
                                                                                {isRowSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4 md:mr-2" />}
                                                                                <span className="hidden md:inline">Update</span>
                                                                            </Button>
                                                                            <Button variant="destructive" size="icon" className="h-8 w-8 md:h-auto md:w-auto md:px-3 md:py-2" onClick={() => handleServiceAction('delete', service, category)} disabled={isRowSaving} style={{ backgroundColor: '#a4262c' }}>
                                                                                {isRowSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 md:mr-2" />}
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <Button size="icon" className="h-8 w-8 md:h-auto md:w-auto md:px-3 md:py-2" onClick={() => handleServiceAction('new', service, category)} disabled={isRowSaving} style={{ backgroundColor: '#011d41' }}>
                                                                            {isRowSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 md:mr-2" />}
                                                                            <span className="hidden md:inline">Add to my Services</span>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )
                )}
            </Tabs>
        </div>
    );
}
