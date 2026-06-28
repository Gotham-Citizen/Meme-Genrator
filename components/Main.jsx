import { useState, useEffect, useRef } from "react"

export default function Main() {
    const [meme, setMeme] = useState({
        topText: "One does not simply",
        bottomText: "Walk into Mordor",
        imageUrl: "https://i.imgflip.com/1bij.jpg",
        topTextX: 50,
        topTextY: 20,
        bottomTextX: 50,
        bottomTextY: 80
    })
    const [allMemes, setAllMemes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [dragging, setDragging] = useState(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

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
        const index = Math.floor(Math.random() * allMemes.length)
        setMeme(prevMeme => ({
            ...prevMeme,
            imageUrl: allMemes[index].url
        }))
    }

    function handleChange(event) {
        const {value, name} = event.currentTarget
        setMeme(prevMeme => ({
            ...prevMeme,
            [name]: value
        }))
    }

    function handleMouseDown(e, textType) {
        const rect = memeRef.current?.getBoundingClientRect()
        if (!rect) return

        // Get the actual position of the text element
        const textElement = textRefs.current[textType]
        if (!textElement) return

        const textRect = textElement.getBoundingClientRect()
        
        // Calculate offset from the text's center (since we use transform: translate(-50%, -50%))
        const offsetX = e.clientX - (textRect.left + textRect.width / 2)
        const offsetY = e.clientY - (textRect.top + textRect.height / 2)

        setDragging(textType)
        setDragOffset({
            x: offsetX,
            y: offsetY
        })
    }

    function handleMouseMove(e) {
        if (!dragging || !memeRef.current) return

        const rect = memeRef.current.getBoundingClientRect()
        
        // Calculate position based on mouse position minus offset
        // Then convert to percentage
        const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100
        const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100

        // Clamp values between 0 and 100
        const clampedX = Math.max(0, Math.min(100, x))
        const clampedY = Math.max(0, Math.min(100, y))

        setMeme(prev => ({
            ...prev,
            [`${dragging}X`]: clampedX,
            [`${dragging}Y`]: clampedY
        }))
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

    if (error) return <main><p className="error">Failed to load memes: {error}</p></main>
    if (loading) return <main><p className="loading">Loading...</p></main>

    return (
        <main>
            <div className="form">
                <label>Top Text
                    <input
                        type="text"
                        placeholder="One does not simply"
                        name="topText"
                        onChange={handleChange}
                        value={meme.topText}
                    />
                </label>

                <label>Bottom Text
                    <input
                        type="text"
                        placeholder="Walk into Mordor"
                        name="bottomText"
                        onChange={handleChange}
                        value={meme.bottomText}
                    />
                </label>
                <button onClick={getMemeImage}>Get a new meme image 🖼</button>
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
                        cursor: 'grab'
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
                        cursor: 'grab'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'bottomText')}
                >
                    {meme.bottomText}
                </span>
            </div>
        </main>
    )
}