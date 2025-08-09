'use client';

import { useState, useEffect, useCallback } from 'react';
import PractitionerServicesForm from './PractitionerServicesForm'; // Adjust path if needed
import { Loader2, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { OnboardingLayout } from './OnboardingLayout';



// --- NEW: API Configuration for Onboarding ---
const ONBOARDING_API_URLS = {
    stepCheck: {
        powerpages: '/_api/cloudflow/v1.0/trigger/0464bee3-2137-f011-8c4e-002248ad99ee',
        local: 'https://prod-21.canadacentral.logic.azure.com:443/workflows/6e00282fb2bd4b9ea44870357d5c15fe/triggers/manual/paths/invoke?api-version=2016-06-01'
    },
    continue: {
        powerpages: '/_api/cloudflow/v1.0/trigger/48150300-3d37-f011-8c4e-002248ad99ee',
        local: 'https://prod-05.canadacentral.logic.azure.com:443/workflows/c99377c56e3c4dd7b3e65b38b5940eb1/triggers/manual/paths/invoke?api-version=2016-06-01'
    }
};

const LOCAL_DEV_USER_ID = "c2c2de7e-8968-f011-bec3-6045bd619595"; // Static user ID for local dev
const isLocalDevelopment = typeof window.shell === 'undefined';


export default function OnboardingServicesPage() {

    const [isLoading, setIsLoading] = useState(true);
    const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set());
    const [allTabNames, setAllTabNames] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('general');


    useEffect(() => {
        const checkOnboardingStep = async () => {
            try {
                let data;

                if (isLocalDevelopment) {
                    console.log("Checking onboarding step in local dev mode...");
                    const tokenResponse = await fetch('http://localhost:3001/api/get-token', { method: 'POST' });
                    const { accessToken } = await tokenResponse.json();
                    if (!accessToken) throw new Error("Could not retrieve access token.");

                    const res = await fetch(ONBOARDING_API_URLS.stepCheck.local, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userid: LOCAL_DEV_USER_ID })
                    });
                    data = await res.json();
                } else {
                    const response = await window.shell.ajaxSafePost({ type: 'POST', url: ONBOARDING_API_URLS.stepCheck.powerpages, data: { eventData: JSON.stringify({}) } });
                    data = JSON.parse(response);
                }

                const status = data.status || 0;

                switch (status) {
                    case 0: window.location.href = '/practitioner-onboarding'; break;
                    case 1: setIsLoading(false); break;
                    case 2: window.location.href = '/onboarding-membership'; break;
                    case 3: window.location.href = '/onboarding-payment/'; break;
                    case 4: window.location.href = '/practitioner-dashboard'; break;
                    default: console.error('Invalid onboarding status:', status);
                }
            } catch (error) {
                console.error('Error fetching onboarding step:', error);
                alert('Error processing your request. Please try again later.');
            } finally {
                // This block will ALWAYS run, whether the API call succeeded or failed.
                // This guarantees the loading spinner will always be turned off.
                setIsLoading(false);
            }
        };

        checkOnboardingStep();
    }, []);

    const handleDataLoaded = useCallback((tabNames: string[]) => {
        setAllTabNames(tabNames);
        if (tabNames.length > 0) {
            setVisitedTabs(prev => new Set(prev).add(tabNames[0]));
        }
    }, []);

    const handleTabChange = useCallback((tabName: string) => {
        setActiveTab(tabName);
        setVisitedTabs(prev => new Set(prev).add(tabName));
    }, []);

    const continueToMembership = async () => {
        setIsSubmitting(true);
        try {
            let data;
            const payload = { status: 2, plan: "", waived: false };

            if (isLocalDevelopment) {
                console.log("Continuing to membership in local dev mode...");
                const tokenResponse = await fetch('http://localhost:3001/api/get-token', { method: 'POST' });
                const { accessToken } = await tokenResponse.json();
                if (!accessToken) throw new Error("Could not retrieve access token.");

                const res = await fetch(ONBOARDING_API_URLS.continue.local, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, userid: LOCAL_DEV_USER_ID })
                });
                data = await res.json();
            } else {
                const response = await window.shell.ajaxSafePost({ type: 'POST', url: ONBOARDING_API_URLS.continue.powerpages, data: { eventData: JSON.stringify(payload) } });
                data = JSON.parse(response);
            }

            if (data.message === 'success' && data.hasGeneralInfo) {
                window.location.href = '/onboarding-membership';
            } else {
                setIsSubmitting(false);
                alert('Please ensure all general information is saved before proceeding.');
            }
        } catch (error) {
            setIsSubmitting(false);
            console.error('Error proceeding to membership:', error);
            //alert('Error processing your request. Please try again later.');
        }
    };

    // const allTabsVisited = allTabNames.length > 0 && visitedTabs.size === allTabNames.length;
    const isFinalStepReached = activeTab === allTabNames[allTabNames.length - 1] && allTabNames.length > 0;


    if (isLoading) {
        return <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><Loader2 className="h-10 w-10 animate-spin text-[#a4262c]" /></div>;
    }

    return (

        <OnboardingLayout>
            {/* The main container still ensures a full-screen background */}
        <div className="bg-[#efefef] min-h-screen flex justify-center items-start p-4 md:p-8">
            <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg max-w-7xl w-full flex flex-col h-full max-h-[95vh]" style={{ paddingBottom: '4rem' }}>

                    {/* TOP SLICE: This part does not grow or scroll. */}
                <div className="flex-shrink-0">
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#011d41' }}>
                        Manage Your Services and Prices
                    </h1>
                    {/* CHANGE 2: The descriptive text has been updated. */}
                    <p className="text-base md:text-lg text-center mb-6" style={{ color: '#011d41' }}>
                        Use the tabs below to select and configure the services you want to offer. Services and prices are internal, hidden from clients, and editable in your offers.
                    </p>
                </div>

                    {/* FILLING: This is the scrollable content area.
                      - flex-grow: Tells this div to expand and fill all available vertical space.
                      - overflow-y-auto: The key! If the content inside is too tall, it will show a scrollbar ONLY for this section.
                    */}
                    <div className="flex-grow overflow-y-auto border-t pt-4">
                        <PractitionerServicesForm
                            onDataLoaded={handleDataLoaded}
                            onTabChange={handleTabChange}
                            activeTab={activeTab}
                            // Add this line to hide the title in the onboarding context
                            showTitle={false}
                        />
                    </div>
                    {/* NEW: The Milestone Bar */}
                    <div className="flex items-center justify-center space-x-0 md:space-x-4 my-6">
                        {allTabNames.map((tabName, index) => {
                            const isCompleted = visitedTabs.has(tabName);
                            const isActive = activeTab === tabName;
                            const isLast = index === allTabNames.length - 1;
                            const label = tabName === 'general' ? 'General' : tabName;

                            return (
                                <div key={tabName} className="flex items-center w-full">
                                    <div className="flex flex-col items-center text-center">
                                        <button
                                            onClick={() => handleTabChange(tabName)}
                                            className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 border-2 rounded-full transition-all duration-300
                                                ${isActive ? 'bg-[#a4262c] border-[#a4262c] text-white' : ''}
                                                ${isCompleted && !isActive ? 'bg-gray-200 border-gray-200' : ''}
                                                ${!isCompleted ? 'border-gray-300' : ''}
                                            `}
                                        >
                                            {isCompleted ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
                                        </button>
                                        <p className={`mt-2 text-xs md:text-sm ${isActive ? 'font-bold text-[#a4262c]' : 'text-gray-500'}`}>{label}</p>
                                    </div>
                                    {!isLast && <div className={`flex-grow h-0.5 transition-colors duration-300 ${isCompleted ? 'bg-gray-300' : 'bg-gray-200'}`} />}
                                </div>
                            );
                        })}
                    </div>
                    {/* BOTTOM SLICE: This part does not grow or scroll. */}
                    <div className="flex-shrink-0 text-center mt-8">
                        <Button
                            onClick={continueToMembership}
                            disabled={!isFinalStepReached || isSubmitting}
                            className="bg-[#a4262c] text-white text-lg font-semibold px-8 py-6 h-auto hover:bg-[#8b1f24] disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Continue to Membership'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </OnboardingLayout>

    );
}