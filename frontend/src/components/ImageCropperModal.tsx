
import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Move, Save } from 'lucide-react';

interface ImageCropperModalProps {
    imageUrl: string;
    onClose: () => void;
    onCropComplete: (croppedImageUrl: string) => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ imageUrl, onClose, onCropComplete }) => {
    const [scale, setScale] = useState(1);
    const [minZoom, setMinZoom] = useState(0.1);
    const [maxZoom, setMaxZoom] = useState(3);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        const CONTAINER_SIZE = 280;
        
        // Calculate scale to cover the container (object-fit: cover)
        // We want the smaller dimension of the image to at least match the container size
        const coverScale = Math.max(CONTAINER_SIZE / naturalWidth, CONTAINER_SIZE / naturalHeight);
        
        // Set min zoom to cover the area (prevent empty spaces)
        // Set max zoom to allow getting closer details
        const calculatedMin = coverScale;
        const calculatedMax = Math.max(coverScale * 5, 3); // Ensure decent zoom range for small images too

        setMinZoom(calculatedMin);
        setMaxZoom(calculatedMax);
        setScale(coverScale);
        setIsLoaded(true);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    // Touch support for mobile devices
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging) {
            const touch = e.touches[0];
            setPosition({
                x: touch.clientX - dragStart.x,
                y: touch.clientY - dragStart.y
            });
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Set output size (standard avatar size)
        const outputSize = 270;
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Fill background with white (safety for transparent images)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outputSize, outputSize);
        
        // Visual container size in UI is fixed at 300px
        const VISUAL_SIZE = 300; 
        const ratio = outputSize / VISUAL_SIZE;
        
        const centerX = outputSize / 2;
        const centerY = outputSize / 2;

        // Apply transformations to match the visual state
        ctx.translate(centerX + position.x * ratio, centerY + position.y * ratio);
        ctx.scale(scale, scale);
        
        // Draw image centered at the new origin
        ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
        
        onCropComplete(canvas.toDataURL('image/png'));
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
            onMouseUp={handleMouseUp} 
            onMouseLeave={handleMouseUp}
            onTouchEnd={handleMouseUp}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Edit Profile Picture</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 flex flex-col items-center">
                    <div className="relative mb-6">
                        {/* Mask Container - Circular Viewport */}
                        <div 
                            className="relative bg-gray-900 overflow-hidden rounded-full border-4 border-brand-500 cursor-move touch-none shadow-inner"
                            style={{ width: '280px', height: '280px' }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            ref={containerRef}
                        >
                             {/* Grid/Guide overlay */}
                             <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
                                 <div className="absolute top-1/2 left-0 w-full h-px bg-white"></div>
                                 <div className="absolute left-1/2 top-0 h-full w-px bg-white"></div>
                             </div>

                            <img 
                                ref={imageRef}
                                src={imageUrl} 
                                onLoad={handleImageLoad}
                                alt="Crop preview" 
                                className={`absolute max-w-none select-none transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    willChange: 'transform'
                                }}
                                draggable={false}
                            />
                            {!isLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center text-white">
                                    Loading...
                                </div>
                            )}
                        </div>
                         <div className="absolute bottom-2 right-2 pointer-events-none text-white drop-shadow-md opacity-50">
                            <Move size={24} />
                        </div>
                    </div>
                    
                    <div className="w-full px-8 space-y-2">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Zoom</span>
                            {/* Show percentage relative to min (cover) scale so 100% looks like normal fit */}
                            <span>{Math.round((scale / minZoom) * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setScale(s => Math.max(minZoom, s - (minZoom * 0.1)))} className="text-gray-500 hover:text-brand-600"><ZoomOut size={20} /></button>
                            <input 
                                type="range" 
                                min={minZoom} 
                                max={maxZoom} 
                                step={minZoom * 0.01} 
                                value={scale} 
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-brand-600"
                            />
                            <button onClick={() => setScale(s => Math.min(maxZoom, s + (minZoom * 0.1)))} className="text-gray-500 hover:text-brand-600"><ZoomIn size={20} /></button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:text-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md"
                        disabled={!isLoaded}
                    >
                        <Save size={16} className="mr-2" />
                        Save Picture
                    </button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};

export default ImageCropperModal;