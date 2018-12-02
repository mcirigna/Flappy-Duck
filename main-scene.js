window.Term_Project = window.classes.Term_Project =
class Term_Project extends Scene_Component
{ 
  constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
  { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
    if( !context.globals.has_controls   ) 
      context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

    // Initial Camera Position
    context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,25 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
    this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

    const r = context.width/context.height;
    context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
    //context.globals.graphics_state.projection_transform = Mat4.orthographic()   // Orthographic camera??  DELETE

    // Available Shapes
    const shapes = {
                      triangle:       new Triangle(),
                      square:         new Square(),
                      tetrahedron:    new Tetrahedron(),
                      windmill:       new Windmill(),
                      cube:           new Cube(),
                      cubeOuline:     new Cube_Outline(),
                      line:           new Line_Segment_Array(),
                      sphere:         new Subdivision_Sphere(4),
                      gridSphere:     new Grid_Sphere(10, 10),
                      //grid:           new Grid_Patch(10, 10),
                      torus:          new Torus(),
                      closedCone:     new Closed_Cone(30, 30),
                      cappedCylinder: new Capped_Cylinder(30, 30),
                      roundedCylinder:new Rounded_Capped_Cylinder(30, 30),
                      axis:           new Axis_Arrows(),
                      text:           new Text_Line(24),
                      bird:           new Shape_From_File("/assets/bird.obj"),
                      cloud:          new Shape_From_File("/assets/cloud.obj"),
                      rock1:          new Shape_From_File("/assets/rock1.obj"),
                      rock2:          new Shape_From_File("/assets/rock2.obj"),
                      mainPipe:       new Main_Pipe(30, 30),
                      pipeTip:        new Pipe_Tip(30, 30)
                   }  
    this.submit_shapes( context, shapes );


    // Available Materials
    this.materials =
                    { 
                      phong: context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ) ), // Parameters: shader, color, ambient, diffusivity, specularity, smoothnes
                      bird: context.get_instance( Phong_Shader ).material( this.basicColors('yellow') ),
                      collision: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance( "assets/collision.png")} ),
                      cloud: context.get_instance( Phong_Shader ).material( this.basicColors('white', 0.5), {ambient: 1, texture: context.get_instance( "assets/sky2.png")} ),
                      rock: context.get_instance( Phong_Shader ).material( this.basicColors('brown', 0.9) ),
                      pipe: context.get_instance( Phong_Shader ).material( this.basicColors('green') ),
                      background: context.get_instance( Scroll_X ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance("assets/seamlessSky.jpg")} ),
                      dirt: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance( "assets/dirt.png")} ),
                      grass: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance( "assets/grass.png")} ),
                      realgrass: context.get_instance( Scroll_X ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance( "assets/realgrass.jpg")} ),
                      sky1: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance("assets/sky1.png")} ),
                      sky1s: context.get_instance( Texture_Scroll_X ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance("assets/sky1.png", true)} ),
                      sky2: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, texture: context.get_instance( "assets/sky2.png")} ),
                      text_image: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, diffusivity: 0, specularity: 0, texture: context.get_instance( "/assets/text.png" ) } )
                    }


    // Available Lights
    this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];


    // Available Sounds
    this.sounds = {
                    birdflap: new Audio('assets/birdflap.wav'),
                    BG: new Audio('assets/BG.mp3'),
                    bounce: new Audio('assets/bounce.wav'),
                    crash: new Audio('assets/crash.mp3'),
                    crashGround: new Audio('assets/crashGround.wav'),
                    PP: new Audio('assets/pp.wav')
                  };

      this.states = {
                      startScreen: 0,
                      play:        1,
                      pause:       2,
                      gameOver:    3
                     };


    /****************
      Class Variables
    ****************/
    this.onLoad = true;
    this.showBoundaries = false; // DELETE
    this.maxHeight = 10;
    this.maxWidth = 18;
    this.state = this.states.startScreen

    // Background for Sky
    this.backgroundSize = 500
                  
    // Ground
    this.groundLevel = -this.maxHeight

    // Score
    this.score = 0.0
    this.finalScore = 0.0

    // Bird
    this.birdPositionOriginal = this.birdPosition = Mat4.identity().times(Mat4.rotation(Math.PI/2, [0, 1, 0]));
    this.birdPositionHeight = this.birdPosition[1][3];
    this.birdAcceleration = -0.25 / 60;
    this.birdSpeed = 0.0;

    // Pipes
    this.pipePositionBottom = Mat4.identity().times(Mat4.translation([this.maxWidth + 15, -(this.maxHeight - 1), 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0]));
    this.pipePositionUpper = Mat4.identity().times(Mat4.translation([this.maxWidth + 15, this.maxHeight, 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0]));
    this.pipes = []; // Each element, a pipe, holds [0] = its position (Mat4), [1] = its speed, [2] = its X coordinate, [3] = its height, [4] = 'top' or 'bottom'
    this.distanceTraveled = 0.0;
    this.pipeSpeed = -5.0;    // this is actually the number we divide 1 by to obtain pipe speed, did this to avoid rounding error
    this.minPipeHeight = 4;   // Both minPipeHeight and maxPipeHeight refer to bottom pipe
    this.maxPipeHeight = 16;

    // Camera
    this.initialDynamicPosition = [0,   0, 25]
    this.finalDynamicPosition   = [-10, 5, 10]
    this.behind = Mat4.inverse(Mat4.look_at( Vec.of( -20,0,10 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ));
    this.center = this.dynamic = this.initial_camera_location;
    this.right = Mat4.inverse(Mat4.look_at( Vec.of( 10,0,25 ), Vec.of( 10,0,0 ), Vec.of( 0,1,0 ) ));
    this.cameraIndex = 0;
  }

  reset()
  {
    this.state = this.states.startScreen
    this.birdPosition = this.birdPositionOriginal
    this.birdSpeed = 0.0
    this.score = 0.0
    this.movePipes('reset')
  }

  endGame()
  {
    this.state = this.states.gameOver
    this.finalScore = this.score
    this.attached = () => this.center
  }



  /**************************************************************
    Returns a chosen color with the specified opacity (0.0 - 1.0)
    If color is not found, returns white
    If opacity is not of range, returns opaque (opacity = 1.0)
  **************************************************************/
  basicColors(color, opacity = 1)
  {
    if(opacity < 0.0 || opacity > 1.0)
      opacity = 1.0;

    switch (color)
    {
      case 'red':     return Color.of(1, 0, 0, opacity);
      case 'green':   return Color.of(0, 1, 0, opacity);
      case 'blue':    return Color.of(0, 0, 1, opacity);
      case 'yellow':  return Color.of(1, 1, 0, opacity);
      case 'cyan':    return Color.of(0, 1, 1, opacity);
      case 'magenta': return Color.of(1, 0, 1, opacity);
      case 'gray':    return Color.of(0.5, 0.5, 0.5, opacity);
      case 'maroon':  return Color.of(0.5, 0, 0, opacity);
      case 'purple':  return Color.of(0.5, 0, 0.5, opacity);
      case 'black':   return Color.of(0, 0, 0, opacity);
      case 'white':   return Color.of(1, 1, 1, opacity);
      case 'brown':   return Color.of(0.8, 0.52, 0.24, opacity);

      default:      return Color.of(1, 1, 1, 1);
    }
  }



  /**************
    Control Panel
  **************/
  make_control_panel()
  { 
    this.key_triggered_button( "Jump",            [ "j" ], () => { 
                                                                   switch (this.state)
                                                                   {
                                                                     case this.states.gameOver:
                                                                      this.reset()
                                                                      this.state = this.states.startScreen
                                                                      break

                                                                     case this.states.startScreen:
                                                                      this.state = this.states.play
                                                                      this.moveBird('jump')
                                                                      break;

                                                                     default:
                                                                      this.moveBird('jump')
                                                                   } 
                                                                 } );
    this.new_line();
    this.key_triggered_button( "Pause",    [ "h" ], () => { this.playSound('PP'); switch (this.state)
                                                                   {
                                                                     case this.states.play:
                                                                      this.state = this.states.pause
                                                                      break

                                                                     case this.states.pause:
                                                                      this.state = this.states.play
                                                                      break;
                                                                   } 
                                                          } );
    this.new_line()
    this.key_triggered_button( "Switch Camera",   [ "c" ], () => { this.cameraIndex++; this.attached = () => this.cameraPositions[this.cameraIndex % this.cameraPositions.length]} );
    this.new_line()
    this.key_triggered_button( "Mute Music",      [ "m" ], () => { this.playSound('BG', undefined, 'mute') } );
    this.new_line()
    this.key_triggered_button( "Reset",           [ "g" ], () => { this.playSound('PP'); this.reset() } );
    this.new_line();
    this.key_triggered_button( "Show Boundaries", [ "b" ], () => { this.showBoundaries = !this.showBoundaries } );     // DELETE

    /* FOR REFERENCE
    this.key_triggered_button( "Change Colors", [ "c" ], this.set_colors );    // Add a button for controlling the scene.


    this.key_triggered_button( "Outline",[ "o" ], () => {
                                                          this.outline = !this.outline
                                                        } )
      
    this.key_triggered_button( "View solar system",  [ "0" ], () => this.attached = () => this.initial_camera_location );
    */
  }



  /***************************************************************************
    Moves the bird specified by the parameter (up, down, jump, gravity, reset)
    Limits the movement to +- 10 from origin
  ***************************************************************************/
  moveBird(direction)
  {
    switch(direction)
    {
      case 'up':
        if ( this.birdPositionHeight < this.maxHeight)
          this.birdPosition = this.birdPosition.times(Mat4.translation([0, 1, 0]))
        break;


      case 'down':
        if ( this.birdPositionHeight > -1 * this.maxHeight)
          this.birdPosition = this.birdPosition.times(Mat4.translation([0, -1, 0]))
        break;


      case 'jump':
        var offset = 0.0005 * this.birdPositionHeight // Offset intended to make the jump less excessive as it approaches max height 
                                                      // and more excessive as it approaches -max height
        this.birdSpeed += 0.35 - offset
        this.playSound("birdflap")
        break;


      case 'gravity':
        if ( this.birdPositionHeight < this.maxHeight && this.birdPositionHeight > this.groundLevel + 2)
        {
          var offset = 0                      // Meant to increase the acceleration(gravity) as bird approaches max height to make game feel more dynamic
          if (this.birdPositionHeight > -5)
            offset = -0.0015 * Math.abs(this.birdPositionHeight)

          this.birdSpeed += this.birdAcceleration + offset;
          this.birdPosition = this.birdPosition.times(Mat4.translation([0, this.birdSpeed, 0]))
        }

        else if (this.birdPositionHeight >= this.maxHeight)
        {
          this.birdSpeed = 0
          this.birdPosition = this.birdPositionOriginal.times(Mat4.translation([0, 9.9, 0]))
          this.playSound('bounce', 0.2)
        }

        else
          { this.endGame(); this.playSound('crashGround', 0.2); }

        break;
    }
  
  }

  

  /**************************************************************
    Generate a pair of pipes and push them to end of pipe array
  **************************************************************/
  addPipes()
  {
    var pipeHeight = this.getRandInteger(this.minPipeHeight, this.maxPipeHeight);
    var extraHeight = this.getRandInteger(0, 8);  // Adds variability to how close pipes are to one another

    // Bottom pipe
    this.pipes.push([]);
    this.pipes[this.pipes.length - 1].push(this.pipePositionBottom.times(Mat4.scale([1, 1, pipeHeight])));
    this.pipes[this.pipes.length - 1].push(1.0/this.pipeSpeed);                               // Initial pipe's speed is 0
    this.pipes[this.pipes.length - 1].push(this.pipes[this.pipes.length - 1][0][0][3] + 5);   // Pipe's X coordinate
    this.pipes[this.pipes.length - 1].push(pipeHeight);                                       // Initial pipe's height
    this.pipes[this.pipes.length - 1].push('bottom'); 
    this.pipes[this.pipes.length - 1].push(this.pipePositionBottom.times(Mat4.translation([0, 0, -(pipeHeight - 1.0)/2.0])));                                         
    
    // Top pipe
    this.pipes.push([]);
    this.pipes[this.pipes.length - 1].push(this.pipePositionUpper.times(Mat4.scale([1, 1, (this.maxHeight * 2 + extraHeight) - pipeHeight])));
    this.pipes[this.pipes.length - 1].push(1.0/this.pipeSpeed);                               // Initial pipe's speed is 0
    this.pipes[this.pipes.length - 1].push(this.pipes[this.pipes.length - 1][0][0][3] + 5);   // Pipe's X coordinate
    this.pipes[this.pipes.length - 1].push((this.maxHeight * 2 + extraHeight) - pipeHeight);  // Initial pipe's height
    this.pipes[this.pipes.length - 1].push('top');
    this.pipes[this.pipes.length - 1].push(this.pipePositionUpper.times(Mat4.translation([0, 0, ((this.maxHeight * 2 + extraHeight) - pipeHeight - 1.0)/2.0])));
  }


  /**********************************
    Updates the position of the pipes
  **********************************/
  movePipes(mode = 'normal')
  {
    // new reset condition for dynamically sized pipe array
    if (mode=='reset') { 
      this.pipes = [];
      this.distanceTraveled = 0.0;
    }

    // Pipe's speed
    this.distanceTraveled += 1.0;
    if (this.pipes.length < 1) {
       this.addPipes();
    }

    if(Math.abs(this.distanceTraveled % (-60)) < 0.01) {
       this.addPipes();
    }

    // For each pipe..
    var i = 0;
    while(i < this.pipes.length)
    {      

      // Move the pipes
      this.pipes[i][0] = this.pipes[i][0].times(Mat4.translation([this.pipes[i][1], 0, 0]));
      this.pipes[i][2] = this.pipes[i][0][0][3];  // Update pipe's X coordinate
      this.pipes[i][5] = this.pipes[i][5].times(Mat4.translation([this.pipes[i][1], 0, 0]));

      // If the pipe goes out of boundary...
      if ( this.pipes[i][2] < -1 * this.maxWidth - 5)
      {
        this.pipes.splice(i, 1);
      }

      else {
        i += 1;
      }
    }

  }



  /*********************************************
    Checks for collisions between bird and pipes
  *********************************************/
  checkCollision()
  {
    var topPipeHeight;
    var bottomPipeHeight;

    // For each pipe..
    for(var i = 0; i < this.pipes.length; i++)
    { 
      var xCoord = this.pipes[i][2]                  // Get its X coordinate
      var height = Math.round(this.pipes[i][3] / 2)  // Get its height
      var topORbottom = this.pipes[i][4]             // Get its position
       
      if (xCoord > -1 && xCoord < 1)
      {
        if (topORbottom == 'bottom')
          bottomPipeHeight = -(this.maxHeight - height)

        else if (topORbottom == 'top')
          topPipeHeight = this.maxHeight- height
      }
    }

    if (this.birdPositionHeight - 0.5 >= bottomPipeHeight && this.birdPositionHeight + 0.5 <= topPipeHeight )
    { if (this.state == this.states.play) this.score++; }
      
    else if (bottomPipeHeight != undefined && topPipeHeight != undefined)
    { 
      this.playSound('crash', 0.15); 
      this.endGame() 
    }

  }



  /********
    Display
  ********/
  display( graphics_state )
  { 
    graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
    const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
    const FPS = 1 / dt  // Frames per second

    // Camera Positions
    var dynamicX = this.interpolateInt(t, this.initialDynamicPosition[0], this.finalDynamicPosition[0])
    var dynamicY = this.interpolateInt(t, this.initialDynamicPosition[1], this.finalDynamicPosition[1])
    var dynamicZ = this.interpolateInt(t, this.initialDynamicPosition[2], this.finalDynamicPosition[2])
    this.dynamic = Mat4.inverse(Mat4.look_at( Vec.of(dynamicX, dynamicY, dynamicZ ), Vec.of( 0,this.birdPositionHeight/2,0 ), Vec.of( 0,1,0 ) ));
    this.cameraPositions = [this.center, this.behind, this.right, this.dynamic];

    // If this.attached is defined (A key/button is pressed)
    if(this.attached)
    { 
      const desired_camera = Mat4.inverse(this.attached());
      graphics_state.camera_transform = desired_camera.map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, 4*dt ) );
    }

    // Draw Sky
    let backWallModelTransform = Mat4.identity().times(Mat4.translation([0,0,-this.backgroundSize]))
                                                .times(Mat4.scale([this.backgroundSize,this.backgroundSize,1]))

    let rightWallModelTransform = Mat4.identity().times(Mat4.translation([this.backgroundSize,0,0]))
                                                 .times(Mat4.scale([1,this.backgroundSize,this.backgroundSize]))
                                                 .times(Mat4.rotation(-Math.PI / 2, Vec.of(0,1,0)))

    this.shapes.square.draw(graphics_state, backWallModelTransform, this.materials.background)
    this.shapes.square.draw(graphics_state, rightWallModelTransform, this.materials.background)

    // Draw Ground
    let groundModelTransform = Mat4.identity().times(Mat4.translation([0,this.groundLevel,0]))
                                              .times(Mat4.scale([100,1,100]))
                                              .times(Mat4.rotation(Math.PI / 2, Vec.of(1,0,0)))

    this.shapes.square.draw(graphics_state, groundModelTransform, this.materials.realgrass)

    // Draw Text 
    switch (this.state) 
    {
      case this.states.startScreen:
        this.shapes.text.set_string( "Flappy Bird" )
        this.shapes.text.draw(graphics_state, Mat4.identity().times(Mat4.translation([-7,3,7])), this.materials.text_image)
        break
      case this.states.gameOver:
        this.shapes.text.set_string( "Game Over" )
        this.shapes.text.draw(graphics_state, Mat4.identity().times(Mat4.translation([-6,3,7])), this.materials.text_image)
        break
    }

    // Draw ScoreBoard
    let score_model_transform = Mat4.identity().times(Mat4.translation([-this.maxWidth + 2, this.maxHeight - 2, 2]))
                                               .times(Mat4.scale([0.75,0.75,0.57]))
    this.shapes.text.set_string( "Score: " + this.score.toString() ) 
    this.shapes.text.draw(graphics_state, score_model_transform, this.materials.text_image);
    

    // Contains elements to load just once such as music
    if (this.onLoad)
    {
      this.playSound('BG', 0.1, 'play');
      this.sounds['BG'].loop = true;
      this.onLoad = false
    }


    // Move and Draw Bird
    this.birdPositionHeight = this.birdPosition[1][3] // Bird's Height
    switch (this.state)
    {
      case this.states.play:
        if (this.state == this.states.play) this.moveBird('gravity')
        this.shapes.bird.draw(graphics_state, this.birdPosition, this.materials.bird)
        break

      case this.states.gameOver:
        this.shapes.square.draw(graphics_state, this.birdPosition.times(Mat4.translation([-2,0,0])).times(Mat4.scale([2,2,2])).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.collision)
        break
    }
    
     


    // Move and Draw Pipes
    if (this.state == this.states.play) this.movePipes()
    for(var i = 0; i < this.pipes.length; i++) {
      this.shapes.mainPipe.draw(graphics_state, this.pipes[i][0], this.materials.pipe)
      this.shapes.pipeTip.draw(graphics_state, this.pipes[i][5], this.materials.pipe)
    }

    // Check for collisions
    this.checkCollision()


    // Draw Rocks
    var rock_position = Mat4.identity().times(Mat4.translation([-4, -8, -4])).times(Mat4.scale([2, 2, 2]))
    this.shapes.rock1.draw(graphics_state, rock_position, this.materials.rock)

    rock_position = Mat4.identity().times(Mat4.translation([4, -8, -4])).times(Mat4.scale([2, 2, 2]))
    this.shapes.rock2.draw(graphics_state, rock_position, this.materials.rock)

    // Draw Bundaries - DELETE
    if (this.showBoundaries)
    {
      this.shapes.axis.draw( graphics_state, Mat4.identity(), this.materials.phong.override( {color: this.basicColors('cyan', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([0, this.maxHeight, 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([0, -1 * this.maxHeight, 0])).times(Mat4.rotation(Math.PI/2, [1, 0, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([this.maxWidth, 0, 0])).times(Mat4.rotation(Math.PI/2, [0, 1, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );

      this.shapes.cube.draw( graphics_state, Mat4.identity().times(Mat4.translation([-1 * this.maxWidth, 0, 0])).times(Mat4.rotation(Math.PI/2, [0, 1, 0])).times(Mat4.scale([1, 1, 0.1])),
                                                               this.materials.phong.override( {color: this.basicColors('red', 0.5) }) );
    }

    // Draw sky
//     if (this.state == this.states.play){
//       for ( var i = 0; i < 18; i+= 1)
//       {
//         let model_transform = Mat4.identity();
//         model_transform = model_transform.times(Mat4.translation([-270, 0, -7]))
//                                          .times(Mat4.translation([i*30, 0, 0]))
//                                          .times(Mat4.scale([15, 15, .0001]));
//         this.shapes.square.draw(graphics_state, model_transform, this.materials.sky1s);
//       }
//     }
//     else 
//     {
//       for ( var i = 0; i < 18; i+= 1)
//       {
//         let model_transform = Mat4.identity();
//         model_transform = model_transform.times(Mat4.translation([-270, 0, -7]))
//                                          .times(Mat4.translation([i*30, 0, 0]))
//                                          .times(Mat4.scale([15, 15, .0001]));
//         this.shapes.square.draw(graphics_state, model_transform, this.materials.sky1);
//       }
//     }
    /*
    for(var i = 0; i < this.maxWidth * 4; i += 2) {
          let model = this.groundModelTransform.times( Mat4.translation( [i + this.groundXTranslation,10 , -50] ) )
                                               .times(Mat4.scale( [ this.groundSize, this.groundSize, this.groundSize ] ) )
          this.shapes.cube.draw(graphics_state, model, this.materials.sky3)
        }


        if (this.state == this.states.play)
        {
          totalSeconds += this.state == this.states.play;
          var scrollSpeed = 100;
    //        var numImages = Math.ceil(canvas.width / img.width) + 1;
    var xpos = totalSeconds * scrollSpeed % 1358;

        }
    */

    /* REFERENCE
    // Setup Sun Light
    let sunLight  = [ new Light ( Vec.of( 0,0,0,1 ), Color.of(sunColorRed, 0, sunColorBlue, 1), 10 ** sunScale) ]
    graphics_state.lights = sunLight

    this.shapes.sphere.draw(graphics_state, planet, this.materials.planet.override( {color: Color.of(0.2, 1, 0.5, 1), specularity: 1, diffusivity: 0.2, gouraud: 1} ))

    this.initial_camera_location = Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ).map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, 0.1 ) )
    */

  }


  
  /*****************
    Helper Functions
  *****************/

  // Returns a random number between min and max (both included)
  getRandInteger(min, max) 
  { return Math.floor(Math.random() * (max - min + 1) ) + min; }


  /* Interpolates between two values
     Interval - Changes the duration between initial and final
     Strength - Affects the difference between final and initial. High number will result in the average between the two.
     verticalOffset - Increases initial and final by the same amount */
  interpolateInt(time, initial, final, interval = 5, strength = 2, verticalOffset = 0.5)
  {
    var interpolationFunction = -(Math.cos(Math.PI * time / interval)) / strength + verticalOffset;
    return initial + interpolationFunction * (final - initial)
  }
  

  // Plays the specified sound
  playSound(name, volume = 1, mode = 'play')
  { 
    switch(mode)
    {
      case 'play':
        this.sounds[ name ].currentTime = 0;
        this.sounds[ name ].volume = Math.min(Math.max(volume, 0), 1);
        var promise = this.sounds[ name ].play();
        break;

      case 'pause':
        this.sounds[ name ].pause()
        break;

      case 'mute':
        if (this.sounds[name].muted == undefined)
          this.sounds[name].muted = true
        else
          this.sounds[name].muted = !this.sounds[name].muted    
        break;
    }
  }
}




// Sky Scrolling Background
class Texture_Scroll_X extends Phong_Shader
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {
      // TODO:  Modify the shader below (right now it's just the same fragment shader as Phong_Shader) for requirement #6.
      return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.di
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec2 mVector = f_tex_coord; 
          mat4 mMatrix = mat4(vec4(1., 0., 0., 0.), vec4(0., 1., 0., 0.), vec4( 0., 0., 1., 0.), vec4( mod(0.4 * animation_time, 88.) , 0., 0., 1.)); 
          vec4 tempVector = vec4(mVector, 0, 0); 
          tempVector = tempVector + vec4(1., 1., 0., 1.); 
          tempVector = mMatrix * tempVector; 

          vec4 tex_color = texture2D( texture, tempVector.xy );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}

class Scroll_X extends Phong_Shader
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {
      return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          
          float vx = 0.05 * animation_time;  // !!!This changes the speed!!!

          mat4 translation = mat4(1.0,0.0,0.0,0.0,    //column 1
                                  0.0,1.0,0.0,0.0,    //column 2
                                  0.0,0.0,1.0,0.0,    //column 3
                                   vx,0.0,0.0,1.0 );  //column 4
          vec4 coord = translation * vec4(f_tex_coord,0.0,1.0);
          vec2 coordinates;  
        
//           if (animation_time > 100.0 )      // After time limit, reset coordinates for better precision
//           {    
//             coordinates = vec2(mod(coord[0],1.000001),coord[1]);
//           } 
//           else 
//           {
//               coordinates = coord.xy;
//           }

          coordinates = coord.xy;

          vec4 tex_color = texture2D( texture, coordinates );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}