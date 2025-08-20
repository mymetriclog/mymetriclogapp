"use client";

import { useState, useEffect } from "react";
import { Search, X, MapPin, Navigation } from "lucide-react";

interface WeatherSearchProps {
  onLocationSelect: (location: any) => void;
  onReturnToCurrentLocation: () => void;
  isCustomLocation: boolean;
  currentLocationCoords: {lat: number, lon: number} | null;
}

export function WeatherSearch({ 
  onLocationSelect, 
  onReturnToCurrentLocation, 
  isCustomLocation, 
  currentLocationCoords
}: WeatherSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);



  // Search functionality with improved results
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
      console.error('OpenWeather API key not found');
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      console.log('🔍 Searching for:', query);
      
      // Try multiple search strategies for better results
      const searchQueries = [
        query, // Original query
        `${query} country`, // Add "country" for country searches
        query.includes(',') ? query : `${query},`, // Add comma for city searches
      ];

      let allResults: any[] = [];
      
      for (const searchQuery of searchQueries) {
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=5&appid=${API_KEY}`;
        console.log('🌐 API URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Search results for', searchQuery, ':', data);
          allResults = [...allResults, ...data];
        } else {
          console.error('❌ API error for', searchQuery, ':', response.status, response.statusText);
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => 
          r.name === result.name && 
          r.country === result.country && 
          r.lat === result.lat && 
          r.lon === result.lon
        )
      );

      // Sort results by relevance (exact matches first, then by name similarity)
      const sortedResults = uniqueResults.sort((a, b) => {
        const aExact = a.name.toLowerCase() === query.toLowerCase();
        const bExact = b.name.toLowerCase() === query.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Sort by country relevance (exact country matches first)
        const aCountryMatch = a.country.toLowerCase().includes(query.toLowerCase());
        const bCountryMatch = b.country.toLowerCase().includes(query.toLowerCase());
        
        if (aCountryMatch && !bCountryMatch) return -1;
        if (!aCountryMatch && bCountryMatch) return 1;
        
        return 0;
      });

      console.log('✅ Final sorted results:', sortedResults);
      setSearchResults(sortedResults.slice(0, 10)); // Limit to 10 results
      setShowSearchResults(true);
      
    } catch (error) {
      console.error('❌ Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    console.log('🔤 Search input:', query);
    setSearchQuery(query);
    
    // Clear previous timeout
    if ((window as any).searchTimeout) {
      clearTimeout((window as any).searchTimeout);
    }
    
    if (query.length >= 2) {
      console.log('🚀 Triggering search for:', query);
      // Add debounce to prevent too many API calls
      (window as any).searchTimeout = setTimeout(() => {
        searchLocations(query);
      }, 300); // 300ms delay
    } else {
      console.log('🛑 Clearing search results (query too short)');
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleLocationSelect = async (location: any) => {
    setSearchQuery(`${location.name}, ${location.country}`);
    setShowSearchResults(false);
    setSearchResults([]);
    
    // Call parent function to handle location selection
    onLocationSelect(location);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showSearchResults && !target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
      {/* Search Bar */}
      <div className="relative search-container flex-1 sm:flex-none">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
          <Search className="h-4 w-4 text-gray-400 ml-3" />
          <input
            type="text"
            placeholder="Search for city, state, or country..."
            value={searchQuery}
            onChange={handleSearchInput}
            className="flex-1 px-3 py-2 text-sm focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Searching for "{searchQuery}"...
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                  Found {searchResults.length} location{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {location.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {location.state && `${location.state}, `}{location.country}
                          {location.lat && location.lon && (
                            <span className="text-xs text-gray-400 ml-2">
                              ({location.lat.toFixed(2)}, {location.lon.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-sm font-medium mb-1">No locations found</div>
                <div className="text-xs mb-3">Try a different search term</div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>💡 Search tips:</div>
                  <div>• Use "country" for countries: "Pakistan country"</div>
                  <div>• Add city names: "Islamabad, Pakistan"</div>
                  <div>• Try specific cities: "Karachi", "Lahore"</div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Current Location Button - Show when user has selected a custom location */}
      {isCustomLocation && currentLocationCoords && (
        <button
          onClick={onReturnToCurrentLocation}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm w-full sm:w-auto justify-center"
        >
          <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Current Location</span>
        </button>
      )}
    </div>
  );
}
