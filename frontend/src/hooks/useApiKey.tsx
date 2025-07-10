import { useState } from 'react';
import { message } from 'antd';
import { useApi } from './useApi';

export function useApiKey() {
    const [apiKey, setApiKey] = useState(localStorage.getItem('api_key') || '');
    const { getApiKey } = useApi();

    const handleGenerate = async () => {
        const key = await getApiKey();
        if (key) {
            setApiKey(key);
            localStorage.setItem('api_key', key);
            message.success('API Key generated and saved!');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey || '');
        message.success('API Key copied to clipboard!');
    };

    return {
        apiKey,
        handleGenerate,
        handleCopy,
    };
}
