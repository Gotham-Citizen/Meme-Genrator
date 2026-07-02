import { useState, useEffect, useRef } from "react"

export default function Main() {
    const [meme, setMeme] = useState({
        topText: "One does not simply",
        bottomText: "Walk into Mordor",
        imageUrl: "https://i.imgflip.com/1bij.jpg",
        topTextX: 50,
        topTextY: 20,
        bottomTextX: 50,
        bottomTextY: 80,
        fontSize: 2 // Default font size in rem
    })
    const [allMemes, setAllMemes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [dragging, setDragging] = useState(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [customTexts, setCustomTexts] = useState([])
    const [nextId, setNextId] = useState(1)

    const memeRef = useRef(null)
    const textRefs = useRef({})

    useEffect(() => {
        fetch("https://api.imgflip.com/get_memes")
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then(data => setAllMemes(data.data.memes))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    function getMemeImage() {
        if (allMemes.length === 0) return
        let index
        let currentUrl = meme.imageUrl

        do {
            index = Math.floor(Math.random() * allMemes.length)
        } while (allMemes[index].url === currentUrl)

        setMeme(prevMeme => ({
            ...prevMeme,
            imageUrl: allMemes[index].url
        }))
    }

    function handleChange(event) {
        const {value, name, id} = event.currentTarget
        if (name) {
                setMeme(prevMeme => ({
                ...prevMeme,
                [name]: value
            }))
        } else if (id) {
            setCustomTexts(prev => 
                prev.map(text => 
                    text.id === parseInt(id) ? { ...text, text: value } : text
                )
            )
        }   
    }

    function increaseFontSize() {
        setMeme(prev => ({
            ...prev,
            fontSize: Math.min(prev.fontSize + 0.5, 5)
        }))

        setCustomTexts(prevTexts => 
        prevTexts.map(text => ({
            ...text,
            fontSize: Math.min(text.fontSize + 0.5, 5)
        }))
    );
    }

    function decreaseFontSize() {
        setMeme(prev => ({
            ...prev,
            fontSize: Math.max(prev.fontSize - 0.5, 0.5)
        }))
        
        setCustomTexts(prevTexts => 
        prevTexts.map(text => ({
            ...text,
            fontSize: Math.min(text.fontSize - 0.5, 5)
        }))  
        );
    }

    function handleFontSizeInput(e) {
        let newValue = parseFloat(e.target.textContent);
        
        if (!isNaN(newValue)) {
            // Apply limits
            if (newValue > 5) {
                newValue = 5;
            } else if (newValue < 0.5) {
                newValue = 0.5;
            }
            
            // Update both states
            setMeme(prev => ({
                ...prev,
                fontSize: newValue
            }));

            setCustomTexts(prevTexts => 
                prevTexts.map(text => ({
                    ...text,
                    fontSize: newValue
                }))
            );
        }
    }

    function handleFontSizeKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    }

    function addTextBox() {
        const newText = {
            id: nextId,
            text: "New Text",
            x: 50,
            y: 50,
            fontSize: meme.fontSize
        }
        setCustomTexts(prev => [...prev, newText])
        setNextId(prev => prev + 1)
    }

    function removeTextBox(id) {
        setCustomTexts(prev => prev.filter(text => text.id !== id))
        delete textRefs.current[`custom-${id}`]
    }

    function handleMouseDown(e, textType, id = null) {
        const rect = memeRef.current?.getBoundingClientRect()
        if (!rect) return

        const textKey = id !== null ? `custom-${id}` : textType
        const textElement = textRefs.current[textKey]
        if (!textElement) return

        const textRect = textElement.getBoundingClientRect()
        
        const offsetX = e.clientX - (textRect.left + textRect.width / 2)
        const offsetY = e.clientY - (textRect.top + textRect.height / 2)

        setDragging(textKey)
        setDragOffset({
            x: offsetX,
            y: offsetY
        })
    }

    function handleMouseMove(e) {
        if (!dragging || !memeRef.current) return

        const rect = memeRef.current.getBoundingClientRect()
        
        const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100
        const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100

        const clampedX = Math.max(0, Math.min(100, x))
        const clampedY = Math.max(0, Math.min(100, y))

        if (dragging.startsWith('custom-')) {
            const id = parseInt(dragging.split('-')[1])
            setCustomTexts(prev => 
                prev.map(text => 
                    text.id === id ? { ...text, x: clampedX, y: clampedY } : text
                )
            )
        } else {
            setMeme(prev => ({
                ...prev,
                [`${dragging}X`]: clampedX,
                [`${dragging}Y`]: clampedY
            }))
        }
    }

    function handleMouseUp() {
        setDragging(null)
    }

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        } else {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragging, dragOffset])

    function handleFocus(e, defaultValue) {
        if (e.target.value === defaultValue) {
            e.target.value = "";
        }
    }

    function handleBlur(e, defaultValue, fieldName) {
        if (e.target.value === "") {
            e.target.value = defaultValue;
            // Update the state with the default value
            if (!isNaN(fieldName)) {
                setCustomTexts(prev => 
                    prev.map(text => 
                        text.id === fieldName ? { ...text, text: defaultValue } : text
                    )
                );
            } else if (fieldName.includes("Text")) {
                setMeme(prevMeme => ({
                    ...prevMeme,
                    [fieldName]: defaultValue
                }));
            } 
        }
    }
        
    async function loadAndDrawImage(imageUrl, container, drawCallback) {
        // 1. 下载图片
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        
        // 2. 创建图片对象
        const img = new Image()
        const objectUrl = URL.createObjectURL(blob)
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                try {
                    // 3. 获取容器尺寸
                    const rect = container.getBoundingClientRect()
                    
                    // 4. 创建画布
                    const canvas = document.createElement('canvas')
                    const scaleFactor = 2
                    canvas.width = rect.width * scaleFactor
                    canvas.height = rect.height * scaleFactor
                    
                    const ctx = canvas.getContext('2d')
                    ctx.scale(scaleFactor, scaleFactor)
                    
                    // 5. 绘制图片
                    ctx.drawImage(img, 0, 0, rect.width, rect.height)
                    
                    // 6. 绘制文字
                    drawTexts(ctx, rect)
                    
                    // 7. 清理临时链接
                    URL.revokeObjectURL(objectUrl)
                    
                    // 8. 执行回调，传入画布
                    resolve({ canvas, ctx, rect })
                } catch (error) {
                    reject(error)
                }
            }
            
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl)
                reject(new Error('Failed to load image'))
            }
            
            img.src = objectUrl
        })
    }
    
    // 导出为 DataURL（在新窗口预览）
    async function exportAsDataURL() {
        const memeElement = memeRef.current
        if (!memeElement) return

        try {
            const { canvas } = await loadAndDrawImage(meme.imageUrl, memeElement)
            
            // 导出为 dataURL
            const dataURL = canvas.toDataURL('image/png')
            
            // 在新窗口预览
            const win = window.open()
            if (win) {
                win.document.write(`<img src="${dataURL}" alt="Exported Meme" style="max-width: 100%;" />`)
                win.document.title = 'Exported Meme'
            }
        } catch (error) {
            console.error('Export error:', error)
            alert('Failed to preview meme. Please try again.')
        }
    }

    // Export as  PNG（下载文件）
    async function exportAsPNG() {
        const memeElement = memeRef.current
        if (!memeElement) return

        try {
            const { canvas } = await loadAndDrawImage(meme.imageUrl, memeElement)
            
            // 下载
            downloadCanvas(canvas, 'meme.png')
        } catch (error) {
            console.error('Export error:', error)
            alert('Failed to export meme. Please try again.')
        }
    }

    function drawTexts(ctx, rect) {
        function drawTextWithShadow(text, x, y, fontSize, color = 'white') {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${fontSize * 16}px impact, sans-serif`;

            // matches .draggable's letter-spacing: 1px (if supported by the browser)
            if ('letterSpacing' in ctx) {
                ctx.letterSpacing = '1px';
            }

            // Matches CSS text-shadow exactly, in the same order:
            // 2px 2px 0, -2px -2px 0, 2px -2px 0, -2px 2px 0,
            // 0 2px 0, 2px 0 0, 0 -2px 0, -2px 0 0, 2px 2px 5px
            const shadows = [
                [2, 2, 0], [-2, -2, 0], [2, -2, 0], [-2, 2, 0],
                [0, 2, 0], [2, 0, 0], [0, -2, 0], [-2, 0, 0],
                [2, 2, 5], // final blurred layer, drawn on top like in CSS
            ];

            ctx.shadowColor = 'black';
            shadows.forEach(([offsetX, offsetY, blur]) => {
                ctx.shadowOffsetX = offsetX;
                ctx.shadowOffsetY = offsetY;
                ctx.shadowBlur = blur;
                ctx.fillStyle = 'black';
                ctx.fillText(text, x, y);
            });

            // reset shadow state before drawing the actual fill text
            ctx.shadowColor = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;

            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
        }

        drawTextWithShadow(
            meme.topText.toUpperCase(),
            (meme.topTextX / 100) * rect.width,
            (meme.topTextY / 100) * rect.height,
            meme.fontSize
        );

        drawTextWithShadow(
            meme.bottomText.toUpperCase(),
            (meme.bottomTextX / 100) * rect.width,
            (meme.bottomTextY / 100) * rect.height,
            meme.fontSize
        );

        customTexts.forEach(customText => {
            drawTextWithShadow(
                customText.text.toUpperCase(),
                (customText.x / 100) * rect.width,
                (customText.y / 100) * rect.height,
                customText.fontSize || meme.fontSize
            );
        });
    }


    if (error) return <main><p className="error">Failed to load memes: {error}</p></main>
    if (loading) return <main><p className="loading">Loading...</p></main>

    return (
        <main>
            <div className="form">
                {/* Top Text - First column */}
                <label>Top Text
                    <input
                        type="text"
                        placeholder="One does not simply"
                        name="topText"
                        onChange={handleChange}
                        value={meme.topText}
                        onFocus={(e) => handleFocus(e, "One does not simply")}
                        onBlur={(e) => handleBlur(e, "One does not simply", "topText")}
                    />
                </label>

                {/* Bottom Text - Second column */}
                <label>Bottom Text
                    <input
                        type="text"
                        placeholder="Walk into Mordor"
                        name="bottomText"
                        onChange={handleChange}
                        value={meme.bottomText}
                        onFocus={(e) => handleFocus(e, "Walk into Mordor")}
                        onBlur={(e) => handleBlur(e, "Walk into Mordor", "bottomText")}
                    />
                </label>

                {/* Custom Text Inputs - Each takes a column */}
                {customTexts.map((customText, index) => {
                    // Determine grid position
                    // If even index, place in first column, if odd, place in second column
                    const isFirstColumn = index % 2 === 0;
                    const gridColumn = isFirstColumn ? 1 : 2;
                    
                    return (
                        <div 
                            key={customText.id} 
                            className="custom-text-wrapper"
                            style={{ gridColumn: gridColumn }}
                        >
                            <label>Custom Text {index + 1}
                                <div className="custom-text-input">
                                    <input
                                        id={customText.id}
                                        type="text"
                                        placeholder="Enter custom text"
                                        value={customText.text}
                                        // onChange={(e) => handleCustomTextChange(customText.id, e)}
                                        onChange={handleChange}
                                        onFocus={(e) => handleFocus(e, "New Text")}
                                        onBlur={(e) => handleBlur(e, "New Text", customText.id)}
                                    />
                                    <button 
                                        onClick={() => removeTextBox(customText.id)} 
                                        type="button"
                                        className="remove-text-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            </label>
                        </div>
                    );
                })}

                {/* Font Size Controls + Add Text Box - Same line */}
                <div className="controls-row">
                    <div className="font-size-controls">
                        <button onClick={decreaseFontSize} type="button">−</button>
                        <span 
                            key={meme.fontSize} 
                            className="font-size-display" 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={handleFontSizeInput}
                            onKeyDown={handleFontSizeKeyDown}
                        >
                            {meme.fontSize}rem
                        </span>
                        <button onClick={increaseFontSize} type="button">+</button>
                    </div>
                    
                    <button onClick={addTextBox} type="button" className="add-text-btn">
                        + Add Text Box
                    </button>
                </div>

                {/* Get Meme Button - Full width */}
                <button 
                    className="get-meme-btn"
                    onClick={getMemeImage}
                >
                    Get a new meme image 🖼
                </button>
            </div>
            
            <div className="meme" ref={memeRef}>
                <img src={meme.imageUrl} alt="Generated meme" />
                <span 
                    ref={el => textRefs.current['topText'] = el}
                    className="top draggable"
                    style={{
                        left: `${meme.topTextX}%`,
                        top: `${meme.topTextY}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: 'grab',
                        fontSize: `${meme.fontSize}rem`
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'topText')}
                >
                    {meme.topText}
                </span>
                <span 
                    ref={el => textRefs.current['bottomText'] = el}
                    className="bottom draggable"
                    style={{
                        left: `${meme.bottomTextX}%`,
                        top: `${meme.bottomTextY}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: 'grab',
                        fontSize: `${meme.fontSize}rem`
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'bottomText')}
                >
                    {meme.bottomText}
                </span>
                
                {customTexts.map((customText) => (
                    <span 
                        key={customText.id}
                        ref={el => textRefs.current[`custom-${customText.id}`] = el}
                        className="draggable custom-text"
                        style={{
                            left: `${customText.x}%`,
                            top: `${customText.y}%`,
                            transform: 'translate(-50%, -50%)',
                            cursor: 'grab',
                            fontSize: `${customText.fontSize || meme.fontSize}rem`
                        }}
                        onMouseDown={(e) => handleMouseDown(e, null, customText.id)}
                    >
                        {customText.text}
                    </span>
                ))}
            </div>
            {/* Export Buttons */}
            <div className="export-controls">
                <button onClick={exportAsPNG} className="export-btn">
                    ⬇️ Download PNG
                </button>
                <button onClick={exportAsDataURL} className="export-btn">
                    👁️ Preview Export
                </button>
            </div>
        </main>
    )
}