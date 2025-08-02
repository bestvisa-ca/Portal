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
  aptUnit?: string;
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
  status: 'approved' | 'underReview' | 'onboarding' | 'rejected' | 'suspended'
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
  aptUnit: string
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
  approved: { color: '#ffffff', bgColor: '#4e925d', label: 'Approved' },
  onboarding: { color: '#ffffff', bgColor: '#a4262c', label: 'Onboarding' },
  underReview: { color: '#ffffff', bgColor: '#a4262c', label: 'Under Review' },
  suspended: { color: '#ffffff', bgColor: '#646769', label: 'Suspended' },
  rejected: { color: '#ffffff', bgColor: '#646769', label: 'Rejected' }
} as const;

function parseLanguageString(langString: string | null): string[] {
  if (!langString) {
    return [];
  }
  // Split by semicolon and trim extra whitespace from each language name.
  return langString.split(';').map(lang => lang.trim());
}
// This function translates the API status string to the correct type for your component
function mapApiStatus(apiStatus?: string): MembershipInfo['status'] {
  if (!apiStatus) return 'underReview'; // Default for missing status

  // Normalize the API string (lowercase, remove spaces) for reliable matching
  const normalizedStatus = apiStatus.toLowerCase().replace(/\s/g, '');

  switch (normalizedStatus) {
    case 'approved':
      return 'approved';
    case 'underreview':
      return 'underReview';
    case 'onboarding':
      return 'onboarding';
    case 'rejected':
      return 'rejected';
    case 'suspended':
      return 'suspended';
    default:
      return 'underReview'; // Fallback for any unknown status
  }
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
  const [isFetching, setIsFetching] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // FIXED: Added image error state for better error handling
  const [imageError, setImageError] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)

  // FIX #1: Use your preferred default avatar path
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    profileImage: '/default-avatar.png', // Back to your preferred default
    available: false,
    languages: [],
    biography: ''
  });

  // MODIFIED: State setters are re-enabled to accept API data.
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo>({
    status: 'underReview',
    memberSince: '',
    expiryDate: '',
    tier: ''
  })

  const [businessAddress, setBusinessAddress] = useState<BusinessAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    aptUnit: ''
  })

  const [licensingInfo, setLicensingInfo] = useState<LicensingInfo>({
    licenseNumber: '',
    issuingAuthority: '',
    isLawyer: false,
    yearsInPractice: 0
  })

  const { setUser } = useUser(); // Get the setUser function from the context

  // FIXED: Create a fallback avatar component for better UX
  const FallbackAvatar = ({ size = 80 }: { size?: number }) => (
    <div
      className="rounded-full bg-gray-200 flex items-center justify-center border-4 shadow-sm"
      style={{
        width: size,
        height: size,
        borderColor: '#efefef',
        backgroundColor: '#f5f5f5'
      }}
    >
      <User className="text-gray-400" style={{ width: size * 0.4, height: size * 0.4 }} />
    </div>
  )

  useEffect(() => {
    // This helper function populates the form states to avoid repeating code.
    const populateStates = (apiData: ApiResponseData) => {
      console.log("DEBUG: Attempting to populate states...");
      if (apiData && apiData.message === 'success') {
        console.log("DEBUG: API message is 'success'. Proceeding to set states.");
        let imageUrl = '/default-avatar.png';
        if (apiData.profileImage && apiData.profileImage.trim() !== '') {
          imageUrl = apiData.profileImage.startsWith('data:image/') ? apiData.profileImage : `data:image/jpeg;base64,${apiData.profileImage}`;
        }
        setUser({
          firstName: apiData.firstName ?? '',
          lastName: apiData.lastName ?? '',
          profileImage: imageUrl
        });
        setFormData({
          firstName: apiData.firstName ?? '',
          lastName: apiData.lastName ?? '',
          phone: apiData.phoneNumber ?? '',
          profileImage: imageUrl,
          available: apiData.available ?? false,
          languages: parseLanguageString(apiData.languages ?? ''),
          biography: apiData.biography ?? '',
        });
        setMembershipInfo({
          status: mapApiStatus(apiData.status),
          memberSince: apiData.memberSince ?? '',
          expiryDate: apiData.expiryDate ?? '',
          tier: apiData.membership ?? '',
        });
        setBusinessAddress({
          street: apiData.street ?? '',
          city: apiData.city ?? '',
          state: apiData.province ?? '',
          zipCode: apiData.zipCode ?? '',
          country: apiData.country ?? '',
          aptUnit: apiData.aptUnit ?? ''
        });
        setLicensingInfo({
          licenseNumber: apiData.licenseNumber ?? '',
          issuingAuthority: apiData.issuingAuthority ?? '',
          isLawyer: apiData.isLawyer ?? false,
          yearsInPractice: apiData.yearsInPractice ?? 0,
        });
        setImageError(false);
        console.log("DEBUG: All states populated successfully.");
      } else {
        console.log("DEBUG: populateStates failed. apiData.message was not 'success' or apiData was null. apiData:", apiData);
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
          const realFlowUrl = 'https://prod-08.canadacentral.logic.azure.com:443/workflows/d3adf5457a224a6eb69fc1d4d08c27ca/triggers/manual/paths/invoke?api-version=2016-06-01';

          const flowResponse = await fetch(realFlowUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "userid": "5bd4fe4a-bc54-f011-bec2-000d3af32e79" })
            // body: JSON.stringify({ "userid": "241e9862-1c20-f011-998a-6045bd5dca91" })
          });

          const apiData = await flowResponse.json();
          populateStates(apiData);

        } else {
          console.log("DEBUG: Running in Power Pages mode.");

          if (typeof window.shell === 'undefined' || typeof window.shell.ajaxSafePost === 'undefined') {
            throw new Error("window.shell.ajaxSafePost is not available. Cannot fetch data.");
          }
          console.log("DEBUG: window.shell.ajaxSafePost is available.");

          const payload = { eventData: JSON.stringify({}) };
          const apiUrl = "/_api/cloudflow/v1.0/trigger/d3a75ec3-9a6c-f011-b4cc-6045bd5dca91";
          
          console.log("DEBUG: Calling Power Pages API at:", apiUrl);
          const response = await window.shell.ajaxSafePost({ type: 'POST', url: apiUrl, data: payload });

          let apiData;
          // Power Pages might return a string or an object. Handle both cases.
          if (typeof response === 'string') {
            try {
              console.log("DEBUG: Response is a string. Attempting to parse JSON.");
              apiData = JSON.parse(response);
            } catch (parseError) {
              console.error("DEBUG: Failed to parse response string:", parseError);
              throw new Error("Received an invalid JSON response from the server.");
            }
          } else {
            console.log("DEBUG: Response is an object.");
            apiData = response;
          }
          
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

  const handleInputChange = useCallback((field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLanguageSelectionChange = useCallback((languages: string[]) => {
    handleInputChange('languages', languages)
  }, [handleInputChange])

  // FIXED: Image error handlers
  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsImageLoading(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
    setIsImageLoading(false);
  }, []);
  const handleBusinessAddressChange = useCallback((field: keyof BusinessAddress, value: string) => {
    setBusinessAddress(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // FIX #3: This is the corrected file upload handler with better error handling.
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    setIsImageLoading(true);
    setImageError(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      if (base64String) {
        // This is the key step: it calls the state update function
        handleInputChange('profileImage', base64String);
        setIsImageLoading(false);
      }
    };
    reader.onerror = () => {
      setImageError(true);
      setIsImageLoading(false);
      alert('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, [handleInputChange]); // Correct dependency

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      alert('First and Last Name are required fields.');
      return;
    }

    setIsSaving(true);
    setError(null);

    // Construct the payload based on your API schema
    const payload = {
      userid: "5bd4fe4a-bc54-f011-bec2-000d3af32e79", // Placeholder for local dev
      firstName: formData.firstName,
      lastName: formData.lastName,
      available: formData.available,
      phoneNumber: formData.phone,
      biography: formData.biography,
      street: businessAddress.street,
      city: businessAddress.city,
      zipCode: businessAddress.zipCode,
      aptUnit: businessAddress.aptUnit
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Saving in local development mode...');

        const tokenResponse = await fetch('http://localhost:3001/api/get-token', { method: 'POST' });
        const { accessToken } = await tokenResponse.json();

        if (!accessToken) throw new Error("Could not retrieve access token.");

        const saveUrl = 'https://prod-14.canadacentral.logic.azure.com:443/workflows/3d7636f132204b4e9802106a8c265921/triggers/manual/paths/invoke?api-version=2016-06-01';

        await fetch(saveUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

      } else {
        console.log('Saving in Power Pages mode...');
        const powerPagesPayloadObject = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          available: formData.available,
          phoneNumber: formData.phone,
          biography: formData.biography,
          status: membershipInfo.status,
          street: businessAddress.street,
          city: businessAddress.city,
          zipCode: businessAddress.zipCode,
          aptUnit: businessAddress.aptUnit
        };
        if (typeof window.shell === 'undefined') {
          throw new Error("Cannot save outside of Power Pages.");
        }

        const apiUrl = '/_api/cloudflow/v1.0/trigger/a08edaee-f16a-f011-b4cc-6045bd5dca91'; // Your production save URL

        // In Power Pages, the payload is wrapped in 'eventData'
        const powerPagesPayload = { eventData: JSON.stringify(powerPagesPayloadObject) };

        await window.shell.ajaxSafePost({
          type: 'POST',
          url: apiUrl,
          data: powerPagesPayload
        });
      }

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

  if (isFetching) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#efefef' }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#a4262c' }} />
      </div>
    );
  }

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
              {/* FIXED: Remove bg-black by explicitly overriding with !important and proper class removal */}
              {imageError || isImageLoading ? (
                <FallbackAvatar size={80} />
              ) : (
                <img
                  src={formData.profileImage}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 shadow-sm !bg-gray-100"
                  style={{
                    borderColor: '#efefef',
                    backgroundColor: '#f5f5f5 !important' // Force override the black background
                  }}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              )}

              {/* Upload overlay */}
              <div className="absolute inset-0 rounded-full bg-opacity-0 hover:bg-opacity-20 transition-all cursor-pointer flex items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-5 h-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" aria-label="Upload profile image" />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="hover:opacity-80 transition-colors"
                style={{ borderColor: '#a4262c', color: '#a4262c' }}
                disabled={isImageLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isImageLoading ? 'Processing...' : 'Change Photo'}
              </Button>
              <p className="text-xs mt-1" style={{ color: '#011d41', opacity: 0.7 }}>JPG, PNG or GIF. Max 5MB.</p>
              {/* FIXED: Added error feedback */}
              {imageError && (
                <p className="text-xs mt-1 text-red-500">
                  Failed to load image. Using default avatar.
                </p>
              )}
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
                <Badge className="font-medium"
                  style={{
                    backgroundColor: STATUS_CONFIG[membershipInfo.status]?.bgColor || '#efefef',
                    color: STATUS_CONFIG[membershipInfo.status]?.color || '#000000'
                  }}
                >
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
            <Label htmlFor="street" className="text-sm font-medium" style={{ color: '#011d41' }}>Street Address</Label>
            <Input
              id="street"
              value={businessAddress.street}
              onChange={(e) => handleBusinessAddressChange('street', e.target.value)}
              className="transition-colors focus:ring-2"
              style={{ borderColor: '#efefef', '--tw-ring-color': '#a4262c' } as React.CSSProperties}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aptUnit" className="text-sm font-medium" style={{ color: '#011d41' }}>Apt. Unit# (Optional)</Label>
              <Input
                id="aptUnit"
                value={businessAddress.aptUnit || ''}
                onChange={(e) => handleBusinessAddressChange('aptUnit', e.target.value)}
                className="transition-colors focus:ring-2"
                style={{ borderColor: '#efefef', '--tw-ring-color': '#a4262c' } as React.CSSProperties}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="text-sm font-medium" style={{ color: '#011d41' }}>Postal Code</Label>
              <Input
                id="zipCode"
                value={businessAddress.zipCode}
                onChange={(e) => handleBusinessAddressChange('zipCode', e.target.value)}
                className="transition-colors focus:ring-2"
                style={{ borderColor: '#efefef', '--tw-ring-color': '#a4262c' } as React.CSSProperties}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium" style={{ color: '#011d41' }}>City</Label>
              <Input
                id="city"
                value={businessAddress.city}
                onChange={(e) => handleBusinessAddressChange('city', e.target.value)}
                className="transition-colors focus:ring-2"
                style={{ borderColor: '#efefef', '--tw-ring-color': '#a4262c' } as React.CSSProperties}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Province</Label>
              <Input id="state" value={businessAddress.state} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium" style={{ color: '#011d41', opacity: 0.8 }}>Country</Label>
              <Input id="country" value={businessAddress.country} className="text-gray-700" style={{ backgroundColor: '#efefef' }} readOnly />
            </div>
            <div /> {/* Empty div to align the country field to the left */}
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
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {error && (
        <p className="text-red-500 text-right text-sm mt-2">{error}</p>
      )}
    </form>
  )
}