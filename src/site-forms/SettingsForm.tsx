'use client'

// RE-ADDED: useEffect for data fetching.
import { useState, useCallback, useRef, useEffect } from 'react'

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/checkbox'
import { Badge } from '../components/ui/badge'

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../components/ui/command'
// RE-ADDED: AlertTriangle for the error UI.
import { User, Building2, ShieldCheck, Upload, X, Check, ChevronsUpDown, Loader2, Settings, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'
import { useUser } from './UserContext'; // Import the hook

// TypeScript declaration for the window.shell object
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
interface ApiResponseData {
  message: string;
  firstName?: string;
  lastName?: string;
  available?: boolean;
  phoneNumber?: string;
  profileImage?: string;
  languages?: string;
  biography?: string | null;
  membership?: string;
  status?: string;
  memberSince?: string;
  expiryDate?: string;
  street?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  country?: string;
  licenseNumber?: string;
  issuingAuthority?: string;
  isLawyer?: boolean;
  yearsInPractice?: number;
}
// Interfaces (Unchanged)
interface UserFormData {
  firstName: string
  lastName: string
  phone: string
  profileImage: string
  available: boolean
  languages: string[]
  biography: string
}

interface MembershipInfo {
  status: 'active' | 'inactive' | 'pending'
  memberSince: string
  expiryDate: string
  tier: string
}

interface BusinessAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface LicensingInfo {
  licenseNumber: string
  issuingAuthority: string
  isLawyer: boolean
  yearsInPractice: number
}

// Constants and MultiSelect Component (Unchanged)...
const AVAILABLE_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese',
  'Korean', 'Portuguese', 'Italian', 'Russian', 'Dutch', 'Swedish',
  'Norwegian', 'Danish', 'Polish', 'Turkish', 'Hebrew', 'Hindi', 'Thai'
] as const

const STATUS_CONFIG = {
  active: { color: 'text-white', bgColor: '#a4262c', label: 'Active' },
  inactive: { color: 'text-white', bgColor: '#011d41', label: 'Inactive' },
  pending: { color: 'text-white', bgColor: '#a4262c', label: 'Pending' }
} as const
function parseLanguageString(langString: string | null): string[] {
  if (!langString) {
    return [];
  }
  // Split by semicolon and trim extra whitespace from each language name.
  return langString.split(';').map(lang => lang.trim());
}
function MultiSelect({
  options,
  selected,
  onSelectionChange,
  placeholder = "Select options...",
  className
}: { options: readonly string[], selected: string[], onSelectionChange: (selected: string[]) => void, placeholder?: string, className?: string }) {
  const [open, setOpen] = useState(false)
  const handleSelect = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter(item => item !== option))
    } else {
      onSelectionChange([...selected, option])
    }
  }
  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selected.filter(item => item !== option))
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-10 h-auto", className)}
          style={{ borderColor: '#efefef' }}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((option) => (
                <Badge
                  key={option}
                  variant="secondary"
                  className="text-white hover:opacity-80 transition-colors"
                  style={{ backgroundColor: '#a4262c' }}
                >
                  {option}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer hover:text-red-300 transition-colors"
                    onClick={(e) => handleRemove(option, e)}
                  />
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ backgroundColor: '#ffffff' }}>
        <Command>
          <CommandInput placeholder="Search languages..." />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option}
                onSelect={() => handleSelect(option)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected.includes(option) ? "opacity-100" : "opacity-0"
                  )}
                  style={{ color: '#a4262c' }}
                />
                {option}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function SettingsForm() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // RE-ADDED: State for initial data fetching
  const [isFetching, setIsFetching] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // MODIFIED: States are initialized empty to await API data.
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    profileImage: '/placeholder.svg?height=80&width=80',
    available: false,
    languages: [],
    biography: ''
  })

  // MODIFIED: State setters are re-enabled to accept API data.
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo>({
    status: 'pending',
    memberSince: '',
    expiryDate: '',
    tier: ''
  })

  const [businessAddress, setBusinessAddress] = useState<BusinessAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })

  const [licensingInfo, setLicensingInfo] = useState<LicensingInfo>({
    licenseNumber: '',
    issuingAuthority: '',
    isLawyer: false,
    yearsInPractice: 0
  })
  const { setUser } = useUser(); // Get the setUser function from the context

  useEffect(() => {
    // This helper function populates the form states to avoid repeating code.
    const populateStates = (apiData: ApiResponseData) => {
      console.log("message:", apiData.message);
      if (apiData && apiData.message === 'success') {
        setUser({
          firstName: apiData.firstName ?? '',
          lastName: apiData.lastName ?? ''
        });

        console.log("message:", apiData.message);
        setFormData({
          firstName: apiData.firstName ?? '',
          lastName: apiData.lastName ?? '',
          phone: apiData.phoneNumber ?? '',
          profileImage: apiData.profileImage ?? '/favicon.ico',
          available: apiData.available ?? false,
          languages: parseLanguageString(apiData.languages ?? ''),
          biography: apiData.biography ?? '',
        });
        setMembershipInfo({
          status: apiData.status === 'Under Review' ? 'pending' : 'inactive',
          memberSince: apiData.memberSince ?? '',
          expiryDate: apiData.expiryDate ?? '',
          tier: apiData.membership ?? '',
        });
        setBusinessAddress({
          street: apiData.street ?? '',
          city: apiData.city ?? '',
          state: apiData.province ?? '', // Note: mapping 'province' to 'state'
          zipCode: apiData.zipCode ?? '',
          country: apiData.country ?? '',
        });
        setLicensingInfo({
          licenseNumber: apiData.licenseNumber ?? '',
          issuingAuthority: apiData.issuingAuthority ?? '',
          isLawyer: apiData.isLawyer ?? false,
          yearsInPractice: apiData.yearsInPractice ?? 0,
        });
      }
    };

    const fetchData = async () => {
      setIsFetching(true);
      setError(null);

      try {
        // --- LOCAL DEVELOPMENT PATH ---
        // Checks if you are running 'npm run dev'
        if (process.env.NODE_ENV === 'development') {
          console.log('Running in local development mode...');

          // Step 1: Get the access token from your local server.
          const tokenResponse = await fetch('http://localhost:3001/api/get-token', { method: 'POST' });
          const { accessToken } = await tokenResponse.json();

          if (!accessToken) {
            throw new Error("Could not retrieve access token from local server.");
          }

          // Step 2: Call the REAL Power Automate API with the token.
          // IMPORTANT: This URL is found inside your Power Automate flow trigger,
          // labeled "HTTP POST URL". It's different from the Power Pages trigger URL.
          const realFlowUrl = 'https://prod-08.canadacentral.logic.azure.com:443/workflows/d3adf5457a224a6eb69fc1d4d08c27ca/triggers/manual/paths/invoke?api-version=2016-06-01'; // <-- Replace with your actual Flow URL

          const flowResponse = await fetch(realFlowUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "userid": "5bd4fe4a-bc54-f011-bec2-000d3af32e79" }) // Send an empty body or required data
          });

          const apiData = await flowResponse.json();
          populateStates(apiData);

        } else {
          // --- PRODUCTION (POWER PAGES) PATH ---
          console.log('Running in Power Pages mode...');

          if (typeof window.shell === 'undefined') {
            throw new Error("This form can only be used within a Power Pages site.");
          }
          const payload = { eventData: JSON.stringify({}) };
          const apiUrl = "/_api/cloudflow/v1.0/trigger/d3a75ec3-9a6c-f011-b4cc-6045bd5dca91";
          const response = await window.shell.ajaxSafePost({ type: 'POST', url: apiUrl, data: payload });
          console.log("API Response:", response);
          const apiData = JSON.parse(response);
          populateStates(apiData);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load your settings. Please try refreshing the page.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [setUser]);
  // Empty dependency array ensures this runs only once on mount
  const handleInputChange = useCallback((field: keyof UserFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleLanguageSelectionChange = useCallback((languages: string[]) => {
    handleInputChange('languages', languages)
  }, [handleInputChange])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
      if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB.'); return; }
      const reader = new FileReader()
      reader.onload = (e) => {
        handleInputChange('profileImage', e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
    if (event.target) event.target.value = '';
  }, [handleInputChange])



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof window.shell === 'undefined') {
      alert('Save cannot be completed. Running in local dev mode.');
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      alert('First and Last Name are required fields.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const apiUrl = '/_api/cloudflow/v1.0/trigger/a08edaee-f16a-f011-b4cc-6045bd5dca91';

      // MODIFIED: The payload now correctly sends the entire formData object.
      const payload = { eventData: JSON.stringify(formData) };

      await window.shell.ajaxSafePost({
        type: 'POST',
        url: apiUrl,
        data: payload
      });
      alert('Settings saved successfully!');

    } catch (err) {
      console.error('Error saving data:', err);
      setError('An error occurred while saving your settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const biographyCharCount = formData.biography.length
  const maxBiographyLength = 500

  // RE-ADDED: Conditional UI for loading state.
  if (isFetching) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#efefef' }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#a4262c' }} />
      </div>
    );
  }

  // RE-ADDED: Conditional UI for error state.
  if (error && !isSaving) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center p-4" style={{ backgroundColor: '#efefef' }}>
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2" style={{ color: '#011d41' }}>Something Went Wrong</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} style={{ backgroundColor: '#a4262c' }}>
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
      <form onSubmit={handleSave} className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex justify-end">
          <Button
            type="button"
            // onClick={handleNavigateToServices}
            className="text-white bg-[#a4262c] hover:bg-[#a4262c]/90"
          >
            <Settings className="w-4 h-4 mr-2" />
            Your Services & Prices
          </Button>
        </div>


        {/* User Details Card */}
        <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow mt-6" style={{ backgroundColor: '#ffffff' }}>
          <CardHeader className="p-0">
            <div className="px-6 py-4" style={{ backgroundColor: '#011d41' }}>
              <CardTitle className="text-white flex items-center gap-2 text-base font-semibold">
                <User className="w-5 h-5" />
                User Details
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={formData.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 shadow-sm" style={{ borderColor: '#efefef' }} />
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-10 transition-all cursor-pointer flex items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-5 h-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" aria-label="Upload profile image" />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="hover:opacity-80 transition-colors" style={{ borderColor: '#a4262c', color: '#a4262c' }}>
                  <Upload className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
                <p className="text-xs mt-1" style={{ color: '#011d41', opacity: 0.7 }}>JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium" style={{ color: '#011d41' }}>First Name <span style={{ color: '#a4262c' }}>*</span></Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className="transition-colors focus:ring-2" style={{ borderColor: '#efefef', '--tw-ring-color': '#a4262c' } as React.CSSProperties} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium" style={{ color: '#011d41' }}>Last Name <span style={{ color: '#a4262c' }}>*</span></Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className="transition-colors focus:ring-2" style={{ borderColor: '#efefef', '--tw-ring-color': '#a4262c' } as React.CSSProperties} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium" style={{ color: '#011d41' }}>Phone Number <span style={{ color: '#a4262c' }}>*</span></Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="transition-colors focus:ring-2" style={{ borderColor: '#efefef', '--tw-ring-color': '#a4262c' } as React.CSSProperties} required />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="available" checked={formData.available} onCheckedChange={(checked) => handleInputChange('available', !!checked)} className="data-[state=checked]:border-0" style={{ backgroundColor: formData.available ? '#a4262c' : 'transparent', borderColor: '#a4262c' }} />
              <Label htmlFor="available" className="text-sm font-medium cursor-pointer" style={{ color: '#011d41' }}>Currently available for new clients</Label>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium" style={{ color: '#011d41' }}>Languages You Can Speak <span style={{ color: '#a4262c' }}>*</span></Label>
              <MultiSelect options={AVAILABLE_LANGUAGES} selected={formData.languages} onSelectionChange={handleLanguageSelectionChange} placeholder="Select languages you can speak..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biography" className="text-sm font-medium" style={{ color: '#011d41' }}>Professional Biography</Label>
              <Textarea id="biography" value={formData.biography} onChange={(e) => handleInputChange('biography', e.target.value)} rows={4} maxLength={maxBiographyLength} className="resize-none transition-colors focus:ring-2" style={{ borderColor: '#efefef', '--tw-ring-color': '#a4262c' } as React.CSSProperties} placeholder="Tell us about your professional background and expertise..." />
              <div className="flex justify-between text-xs" style={{ color: '#011d41', opacity: 0.7 }}>
                <span>Brief description of your professional background</span>
                <span className={biographyCharCount > maxBiographyLength * 0.9 ? 'font-medium' : ''} style={{ color: biographyCharCount > maxBiographyLength * 0.9 ? '#a4262c' : '#011d41' }}>{biographyCharCount}/{maxBiographyLength}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Membership Information */}
        <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow mt-6" style={{ backgroundColor: '#ffffff' }}>
          <CardHeader className="p-0">
            <div className="px-6 py-4" style={{ backgroundColor: '#011d41' }}>
              <CardTitle className="text-white flex items-center gap-2 text-base font-semibold">
                <User className="w-5 h-5" />
                Membership Information
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Status</Label>
                <div className="mt-1">
                  <Badge className="font-medium text-white" style={{ backgroundColor: STATUS_CONFIG[membershipInfo.status]?.bgColor || '#efefef' }}>
                    {STATUS_CONFIG[membershipInfo.status]?.label || 'N/A'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Member Since</Label>
                <p className="mt-1 text-sm font-medium" style={{ color: '#011d41' }}>
                  {membershipInfo.memberSince ? new Date(membershipInfo.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Expiry Date</Label>
                <p className="mt-1 text-sm font-medium" style={{ color: '#011d41' }}>
                  {membershipInfo.expiryDate ? new Date(membershipInfo.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Membership Tier</Label>
                <p className="mt-1 text-sm font-medium" style={{ color: '#011d41' }}>{membershipInfo.tier || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Address in Canada */}
        <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow mt-6" style={{ backgroundColor: '#ffffff' }}>
          <CardHeader className="p-0">
            <div className="px-6 py-4" style={{ backgroundColor: '#011d41' }}>
              <CardTitle className="text-white flex items-center gap-2 text-base font-semibold">
                <Building2 className="w-5 h-5" />
                Business Address in Canada
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Street Address</Label>
              <Input id="street" value={businessAddress.street} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>City</Label>
                <Input id="city" value={businessAddress.city} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Province</Label>
                <Input id="state" value={businessAddress.state} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Postal Code</Label>
                <Input id="zipCode" value={businessAddress.zipCode} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Country</Label>
                <Input id="country" value={businessAddress.country} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Licensing and Regulatory Information */}
        <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow mt-6" style={{ backgroundColor: '#ffffff' }}>
          <CardHeader className="p-0">
            <div className="px-6 py-4" style={{ backgroundColor: '#011d41' }}>
              <CardTitle className="text-white flex items-center gap-2 text-base font-semibold">
                <ShieldCheck className="w-5 h-5" />
                Licensing and Regulatory Information
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>License Number</Label>
              <Input id="licenseNumber" value={licensingInfo.licenseNumber} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuingAuthority" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Issuing Authority</Label>
              <Input id="issuingAuthority" value={licensingInfo.issuingAuthority} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="isLawyer" checked={licensingInfo.isLawyer} disabled className="data-[state=checked]:border-0" style={{ backgroundColor: licensingInfo.isLawyer ? '#a4262c' : 'transparent', borderColor: '#a4262c' }} />
                <Label htmlFor="isLawyer" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>I am a Lawyer</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsInPractice" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Years in Practice</Label>
                <Input id="yearsInPractice" value={licensingInfo.yearsInPractice} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="px-6 text-white bg-[#a4262c] hover:bg-[#a4262c]/90"
          // disabled={isSaving}
          >
            Save Changes
          </Button>
        </div>

        {error && (
          <p className="text-red-500 text-right text-sm mt-2">{error}</p>
        )}
      </form>


  )
}