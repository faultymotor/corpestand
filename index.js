const yaml = require('js-yaml')
const prompt = require('prompt-sync')();

// {Rotation:[0f],Pose:{Body:[0f,0f,0f],Head:[0f,0f,0f],LeftLeg:[0f,0f,0f],RightLeg:[0f,0f,0f],LeftArm:[0f,0f,0f],RightArm:[0f,0f,0f]}}
const fromPoseArg = (pose_arg) => {
	obj = yaml.safeLoad(pose_arg)

	flat_obj = {
		...obj.Pose,
		...(obj.Rotation && { Rotation: obj.Rotation })
	}

	Object.keys(flat_obj).forEach(key => flat_obj[key] = flat_obj[key].map(v => Number(v.replace('f', ''))))

	return flat_obj
}


const toPoseArg = (pose_obj) => {
	rotation = false

	if (obj.Rotation) {
		rotation = pose_obj.Rotation
		delete pose_obj.Rotation
	}

	pose_str = Object.keys(pose_obj).reduce((acc, cur) => `${acc},${cur}:[${pose_obj[cur].map(v => v.toFixed(2) + 'f').toString()}]`, '').substring(1)

	return `{${rotation ? `Rotation:[${rotation}],` : ''}Pose:{${pose_str}}}`
}

const calcPoint = (timestamp, time, start, end) => {
	fn = (x) => ((timestamp / time) * (end - start)) + start

	return fn(timestamp)
}

const interpolator = (time, fps, starting_cmd, ending_cmd) => {
	starting_pos = fromPoseArg(starting_cmd)
	ending_pos = fromPoseArg(ending_cmd)

	changing = []

	for (key of Object.keys(starting_pos)) {
		if (!(starting_pos[key].every((v, idx) => v === ending_pos[idx]))) {
			changing.push(key)
		}
	}

	frames = []

	for (let i = 0; i <= time; i += 1 / fps) {
		frames.push(changing.reduce((acc, cur) => ({
			[cur]: starting_pos[cur].map((v, idx) => calcPoint(i, time, v, ending_pos[cur][idx])),
			...acc
		}), {}))
	}

	for (pos of frames) {
		console.log(toPoseArg(pos))
	}
}

while(true) {
	interpolator(prompt('How long is the animation in seconds?'),
				 prompt('How many frames per second?'),
				 prompt('What is the starting pose?'),
				 prompt('What is the ending pose?'),
	)
}
	