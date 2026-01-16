  const canvas = document.querySelector('canvas'); // Lấy thẻ canvas
    const ctx = canvas.getContext('2d'); // Lấy context 2d
    const game = {}; // Object này để chứa dữ liệu game

    function createText(x, y, style, align, content) {
      ctx.textAlign = align;
      ctx.font = style;
      ctx.fillText(content, x, y);
    }

    function checkCollision(obj1, obj2) {
      if (obj1.x > obj2.x + obj2.w
        || obj1.x + obj1.w < obj2.x
        || obj1.y > obj2.y + obj2.h
        || obj1.y + obj1.h < obj2.y) {
        return false;
      } else {
        return true;
      }
    };

    function createImg(src) {
      const image = new Image();
      image.src = src;
      return image;
    }

    function Player(img, x, y, w, h) {
      this.img = createImg(img); // Ảnh của vật thể
      this.x = x; // Tọa độ x
      this.y = y; // Tọa độ y
      this.w = w; // Chiều rộng
      this.h = h; // Chiều cao
      this.maxJump = 500; // Độ cao nhảy tối đa
      this.jumpStatus = "None"; //Trạng thái nhảy

      this.update = () => {
        // Nếu trạng thái nhảy là up thì tăng tọa độ y
        if (this.jumpStatus === "Up") {
          this.y += 10;
          if (this.y >= this.maxJump) {
            this.y = this.maxJump;
            this.jumpStatus = "Down";
          }
        }
        // Nếu trạng thái nhảy là down thì giảm tọa độ y
        if (this.jumpStatus === "Down") {
          this.y -= 10;
          if (this.y <= 0) {
            this.y = 0
            this.jumpStatus = "None";
          }
        }
        // Vẽ ảnh trên canvas
        ctx.drawImage(this.img, this.x, 720 - this.y - this.h, this.w, this.h);
      }
    }

    function Obstacle(img, x, y, w, h) {
      this.img = createImg(img);
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.active = true;

      this.update = () => {
        if (!this.active) return;
        // Chướng ngại vật sẽ di chuyển từ phải qua trái
        this.x -= 10;
        if (this.x <= -this.w) {
          this.active = false;
        }
        ctx.drawImage(this.img, this.x, 720 - this.y - this.h, this.w, this.h);
      }
    }

    function genObstacle() {
      // Nếu chưa đến thời gian tạo chướng ngại vật mới thì return luôn
      if (game.nextObstacleTmp > new Date().getTime()) return;
      // Tạo sỗ ngẫu nhiên 0 hoặc 1
      const randomNum = Math.floor(Math.random() * 2);
      // Nếu số là 0 thì tạo pokeball
      if (randomNum == 0) {
        const newObstacles = new Obstacle('https://media.discordapp.net/attachments/600891241185411082/875985078428237874/pokeball.png', 1280, 0, 200, 200);
        game.obstacles.push(newObstacles);
      } else {
        // Nếu không thì tạo con Nyasu là Nyasu
         const newObstacles = new Obstacle('https://cdn.discordapp.com/attachments/933697182882734090/981838972500205568/meowth_icon-icons.com_67543.png', 1280, 0, 220, 220);
        game.obstacles.push(newObstacles);
      }
      // Cập nhật thời gian sinh chướng ngại vật tiếp theo
      game.nextObstacleTmp = new Date().getTime() + Math.floor(Math.random() * 2000) + 1000;
    }

    function resizeCanvas() {
      if ((window.innerWidth / window.innerHeight) >= (1280 / 720)) {
        canvas.style.width = "";
        canvas.style.height = "100%";
      } else {
        canvas.style.width = "100%";
        canvas.style.height = "";
      }
    }

    function updateScore() {
      game.score = Math.floor((new Date().getTime() - game.startTime) / 100);
      createText(1280 - 50, 50, "28px Arial", "right", `Score: ${game.score}`);
    }

    function gameLoop() {
      resizeCanvas();
      // Xóa frame cũ
      ctx.clearRect(0, 0, 1280, 720);
      // Cập nhật điểm
      updateScore();
      // Tạo chướng ngại vật mới
      genObstacle();
      // Cập nhật vị trí khủng long
      game.pikachu.update();
      // Cập nhật vị trí các chướng ngại vật
      for (let i = 0; i < game.obstacles.length; i++) {
        game.obstacles[i].update();
        // Kiểm trai va chạm với khủng long, nếu va chạm thì game kết thúc
        if (checkCollision(game.obstacles[i], game.pikachu)) {
          createText(1280 / 2, 720 / 2, "40px Arial", "center", "GAME OVER");
          document.getElementById('play-again').style.display = "inline-block";
          return window.cancelAnimationFrame(gameLoop);
        }
      }
      window.requestAnimationFrame(gameLoop);
    }

    function initGame() {
      // Ẩn nút chơi lại
      document.getElementById('play-again').style.display = "none";
      game.score = 0;
      game.startTime = new Date().getTime();
      // Tạo Player
      game.pikachu = new Player('https://media.discordapp.net/attachments/600891241185411082/875985072942120960/pikachu.png', 100, 0, 200, 200);
      // Danh sách các chướng ngại vật
      game.obstacles = [];
      // Mốc thời gian tạo chướng ngại vật tiếp theo
      game.nextObstacleTmp = new Date().getTime() + Math.floor(Math.random() * 2000) + 1000;
      // Xử lý sự kiên khi ấn phím cách thì nhảy lên
      window.onkeyup = function (e) {
        if (e.keyCode == 32) {
          if (game.pikachu.jumpStatus == "None")
            game.pikachu.jumpStatus = "Up";
        }
      }
      gameLoop();
    }
    initGame();