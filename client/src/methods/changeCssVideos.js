const changeCssVideos = ({ main, elms }) => {
    let widthMain = main.offsetWidth;
    let minWidth = "30%";
    if (widthMain * 30 / 100 < 300) {
        minWidth = "300px";
    }
    
    let mobile = false;
    if (window.innerWidth < 700 && window.innerWidth <= window.innerHeight) {
        mobile = true;
    }
    
    let width, height;
    
    if (elms === 0 || elms === 1) {
        width = "80%";
        height = "100%";
    } else if (elms === 2) {
        width = mobile ? "100%" : "45%";
        height = mobile ? "auto" : "auto"; 
    } else if (elms === 3 || elms === 4) {
        width = mobile ? "100%" : "35%";
        height = mobile ? "auto" : "auto";
    } else {
        width = mobile ? "100%" : String(100 / elms) + "%";
        height = "auto";
    }
    
    if (elms > 2) {
        let maxHeight = "50%";
        height = maxHeight;
    }
    
    console.log(width, height);
    
    let videoWrapper = main.querySelectorAll(".videoWrapper");
    for (let a = 0; a < videoWrapper.length; ++a) {
        videoWrapper[a].style.minWidth = minWidth;
        videoWrapper[a].style.minHeight = minWidth * 9 / 16 + "px";
        videoWrapper[a].style.setProperty("width", width);
        videoWrapper[a].style.setProperty("height", height);
    }
    
    let localVideoWrapper = main.querySelectorAll(".localVideoWrapper");
    for (let a = 0; a < localVideoWrapper.length; ++a) {
        localVideoWrapper[a].style.minWidth = minWidth;
        localVideoWrapper[a].style.minHeight = minWidth * 9 / 16 + "px";
        localVideoWrapper[a].style.setProperty("width", width);
        localVideoWrapper[a].style.setProperty("height", height);
    }

    // Add media queries for different screen sizes
    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(`
        @media (max-width: 600px) {
            .videoWrapper, .localVideoWrapper {
                width: 100% !important;
                height: auto !important;
            }
        }
    `, styleSheet.cssRules.length);
    styleSheet.insertRule(`
        @media (min-width: 601px) and (max-width: 1024px) {
            .videoWrapper, .localVideoWrapper {
                width: 50% !important;
                height: auto !important;
            }
        }
    `, styleSheet.cssRules.length);
    styleSheet.insertRule(`
        @media (min-width: 1025px) {
            .videoWrapper, .localVideoWrapper {
                width: ${width} !important;
                height: ${height} !important;
            }
        }
    `, styleSheet.cssRules.length);
    
    return { minWidth, minHeight: minWidth * 9 / 16 + "px", width, height };
};

export default changeCssVideos;