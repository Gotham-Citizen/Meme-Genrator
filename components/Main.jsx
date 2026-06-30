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
        </main>
    )
}