import { useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FiX, FiInfo, FiArrowRight, FiCheck, FiUpload } from 'react-icons/fi';

const ImportModal = ({ onClose }) => {
    const [step, setStep] = useState(1); // 1: Select Source, 2: Map Columns, 3: Result
    const [mode, setMode] = useState('csv'); // csv | google
    const [file, setFile] = useState(null);
    const [sheetUrl, setSheetUrl] = useState('');
    const [headers, setHeaders] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Mappings
    const [mapping, setMapping] = useState({
        name: '',
        phone: '',
        email: '',
        source: '',
        status: '',
        notes: ''
    });

    const handlePreview = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let res;
            if (mode === 'csv') {
                if (!file) return toast.error('Please select a file');
                const formData = new FormData();
                formData.append('file', file);
                res = await API.post('/leads/import/preview-csv', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                if (!sheetUrl) return toast.error('Enter a URL');
                res = await API.post('/leads/import/preview-sheet', { sheetUrl });
            }

            setHeaders(res.data.headers);
            setPreviewData(res.data.preview);

            // Auto-guess mappings
            const newMapping = { ...mapping };
            res.data.headers.forEach(h => {
                const lower = h.toLowerCase();
                if (lower.includes('name')) newMapping.name = h;
                if (lower.includes('phone') || lower.includes('mobile')) newMapping.phone = h;
                if (lower.includes('email')) newMapping.email = h;
                if (lower.includes('source')) newMapping.source = h;
                if (lower.includes('status')) newMapping.status = h;
                if (lower.includes('note')) newMapping.notes = h;
            });
            setMapping(newMapping);
            setStep(2);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to preview file');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!mapping.name || !mapping.phone) {
            return toast.error('Please map at least Name and Phone columns');
        }

        setLoading(true);
        try {
            let res;
            if (mode === 'csv') {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('mapping', JSON.stringify(mapping));
                res = await API.post('/leads/import/csv', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await API.post('/leads/import/google-sheet', { sheetUrl, mapping });
            }
            setResult(res.data);
            setStep(3);
            toast.success('Import processed');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Import failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: step === 2 ? '600px' : '500px', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Import Leads</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Fast track your lead generation</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}>
                        <FiX />
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    {step === 1 && (
                        <div className="animate-fade-in">
                            {/* Segmented Control */}
                            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
                                <button
                                    type="button"
                                    onClick={() => setMode('csv')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                                        background: mode === 'csv' ? 'white' : 'transparent',
                                        color: mode === 'csv' ? 'var(--primary)' : '#64748b',
                                        boxShadow: mode === 'csv' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    CSV Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('google')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                                        background: mode === 'google' ? 'white' : 'transparent',
                                        color: mode === 'google' ? 'var(--primary)' : '#64748b',
                                        boxShadow: mode === 'google' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Google Sheets
                                </button>
                            </div>

                            {mode === 'csv' ? (
                                <div
                                    style={{
                                        border: `2px dashed ${file ? 'var(--primary)' : '#e2e8f0'}`,
                                        borderRadius: '16px',
                                        padding: '40px 20px',
                                        textAlign: 'center',
                                        background: file ? '#e0e7ff33' : '#f8fafc',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    onClick={() => document.getElementById('file-upload').click()}
                                >
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".csv"
                                        onChange={e => setFile(e.target.files[0])}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ width: '48px', height: '48px', background: '#e0e7ff', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 16px' }}>
                                        <FiUpload />
                                    </div>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: '#1e293b' }}>
                                        {file ? file.name : 'Click to upload CSV'}
                                    </h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                        {file ? `${(file.size / 1024).toFixed(1)} KB` : 'SVG, PNG, JPG or GIF (max. 800x400px)'}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ marginBottom: '24px' }}>
                                    <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Google Sheet URL</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="form-input"
                                            placeholder="https://docs.google.com/spreadsheets/d/..."
                                            value={sheetUrl}
                                            onChange={e => setSheetUrl(e.target.value)}
                                            style={{ paddingLeft: '44px' }}
                                        />
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', background: '#10b981', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                                            G
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>
                                        Make sure the sheet is accessible to anyone with the link.
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handlePreview}
                                    disabled={loading || (mode === 'csv' && !file) || (mode === 'google' && !sheetUrl)}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {loading ? (
                                        <>Analyzing File...</>
                                    ) : (
                                        <>Continue to Mapping <FiArrowRight /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in">
                            <p style={{ marginBottom: '24px', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                We found <strong>{headers.length} columns</strong>. Please map them to the correct fields in Mikromedia.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                                {['name', 'phone', 'email', 'source', 'status', 'notes'].map((field) => (
                                    <div key={field} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: mapping[field] ? '1px solid #c7d2fe' : '1px solid #e2e8f0' }}>
                                        <label className="input-label" style={{ textTransform: 'capitalize', color: '#475569', marginBottom: '8px' }}>
                                            {field} {['name', 'phone'].includes(field) && <span style={{ color: 'var(--danger)' }}>*</span>}
                                        </label>
                                        <select
                                            className="form-input"
                                            value={mapping[field]}
                                            onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                                            style={{
                                                borderColor: mapping[field] ? 'var(--primary)' : '#e2e8f0',
                                                background: 'white',
                                                fontSize: '0.9rem',
                                                padding: '8px 12px'
                                            }}
                                        >
                                            <option value="">Select Column</option>
                                            {headers.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                                <button className="btn btn-outline" onClick={() => setStep(1)} disabled={loading}>Back</button>
                                <button className="btn btn-primary" onClick={handleImport} disabled={loading} style={{ paddingLeft: '32px', paddingRight: '32px' }}>
                                    {loading ? 'Importing...' : 'Start Import'} <FiCheck />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && result && (
                        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 24px' }}>
                                <FiCheck />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Import Successful!</h2>
                            <p style={{ color: '#64748b', marginBottom: '32px' }}>Your leads have been added to the pipeline.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{result.imported}</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{result.skipped}</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skipped</div>
                                </div>
                            </div>

                            {result.errors > 0 && (
                                <div style={{ marginBottom: '24px', textAlign: 'left', background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold', marginBottom: '8px' }}>
                                        <FiInfo /> {result.errors} Issues Found
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#b91c1c', maxHeight: '100px', overflowY: 'auto' }}>
                                        {result.errorDetails?.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                            )}

                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Return to Leads</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
