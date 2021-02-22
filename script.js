const MAX_FILES_NUMBER = 5,
      MAX_FILE_SIZE_MB = 0.01,
      MAX_TOTAL_FILES_SIZE_MB = 10,
      MAX_SECTIONS_NUMBER = 20,
      MAX_IMG_SIDES_RATIO = 1,
      $form = $('form#add-keys-form'),
      allImageInputs = $form.find('input.input-files'),
      $totalImagesSizeBar = $('.progress-bar')

async function checkAndDisplayPhotos(event = false, forceRedraw = false) {
	let totalImagesSize = 0,
	    totalImagesSizeMb = 0,
	    isValid = true,
	    isImgSizeValid = true,
	    isImgAspectRatioValid = true
	const isChange = event ? true : false,
	      $inputsToCount = (isChange) ? $(event.target) : allImageInputs

	for (const inputToCount of $inputsToCount) {
		console.log('--|in inputsToCount loop')
		const $addKeysImage = $(inputToCount).closest('.add-keys-image'),
		      $inavlidPhotoUpload = $addKeysImage.find('.invalid-photo-upload'),
		      $invalidMaxFiles = $addKeysImage.find('.invalid-max-files')

		if (isChange || forceRedraw) {
			const imageFiles = Array.from(inputToCount.files),
			      $imagesOrderedList = $addKeysImage.find('.images-list')
			      $imagesOrderedList[0].innerHTML = ''

			for (const image of imageFiles) {
				console.log("--|--|in imageFiles loop")
				let imgSize = convertBytesToMb(image.size).toFixed(1)
				const reader = new FileReader()

				if (imgSize >= 10) imgSize = Math.round(imgSize)

				function loadFile() {
					console.log('--|--|--|in loadFile function')
					return new Promise(resolve => {
						reader.onload = function(event) {
							console.log("--|--|--|--|start callback onload reader...")
							const isImgOversize = (imgSize > MAX_FILE_SIZE_MB),
							      invalidImgSizeClass = (isImgOversize) ? 'invalid-image-size' : ''
							if (isImgOversize) {
								isImgSizeValid = false
								isValid = false
							}
							if (imgSize < 0.1) imgSize = '<0.1'

							let img = new Image()

							img.src = URL.createObjectURL(image)

							img.onload = function() {
								console.log('--|--|--|--|--|start callback onload image...')
								const imgWidth = this.naturalWidth,
								      imgHeight = this.naturalHeight,
								      isImgAspectRatioTooBig = MAX_IMG_SIDES_RATIO < ((imgWidth > imgHeight) ?
								                                    imgWidth / imgHeight : imgHeight / imgWidth
								                               ),
								      invalidImageSidesRatioClass = (isImgAspectRatioTooBig) ? 'invalid-image-sides-ratio' : ''
								if (isImgAspectRatioTooBig) {
									isImgAspectRatioValid = false
									isValid = false
								}
								$imagesOrderedList[0].innerHTML += '<div class="uploaded-image">' +
								                                        '<div class="image-preview '+invalidImgSizeClass+' '+invalidImageSidesRatioClass+'" style="background-image: url(' + event.target.result + ')"></div>' +
								                                        '<div class="image-name">' + image.name + '</div>' +
								                                        '<span class="image-size">'+ imgSize + ' MB' + '</span>' +
								                                        '<input class="image-delete-btn" data-file-hash=' + getFileHash(image) + ' type="button" value="X">' +
								                                   '</div>'
								resolve()
								console.log('--|--|--|--|--|finish callback onload image')
							}
							console.log('--|--|--|--|finish callback onload reader')
						}
						reader.readAsDataURL(image)

					})
				}
				await loadFile()
				console.log('--|--|outside loadFile function')
			}
			console.log("--|outside imageFiles loop")
		}
		if (inputToCount.files.length < 1 && !forceRedraw) {
			$inavlidPhotoUpload.removeClass('d-none')
			isValid = false
		}
		else {
			$inavlidPhotoUpload.addClass('d-none')
		}

		if (inputToCount.files.length > MAX_FILES_NUMBER) {
			$invalidMaxFiles.removeClass('d-none')
			isValid = false
		}
		else {
			$invalidMaxFiles.addClass('d-none')
		}
	}
	console.log('outside inputsToCount loop')
	if (!isImgSizeValid) {
		alert("Некоторые фотографии превышают допустимый вес, они выделены красным. Максимально допустимый вес фотографии- " + MAX_FILE_SIZE_MB + " МБ")
	}
	if (!isImgAspectRatioValid) {
		alert("Некоторые фотографи недопустимого формата. Максимальный коэффициент соотношения сторон фотографии - " + MAX_IMG_SIDES_RATIO)
	}
	allImageInputs.each(function() {
		Array.from(this.files).forEach(image => {
			totalImagesSize += image.size
		})
	})

	totalImagesSizeMb = convertBytesToMb(totalImagesSize).toFixed(2)

	if (totalImagesSizeMb > MAX_TOTAL_FILES_SIZE_MB) {
		alert(`The total size: ${totalImagesSizeMb} Mb. It should not exceed ${MAX_TOTAL_FILES_SIZE_MB} Mb`)
		isValid = false
	}
	const totalImagesSizeMbPercentage = (totalImagesSizeMb / MAX_TOTAL_FILES_SIZE_MB * 100).toFixed(1)

	$totalImagesSizeBar.css('width',`${totalImagesSizeMbPercentage}%`)
	$totalImagesSizeBar[0].innerHTML = `${totalImagesSizeMbPercentage}%`

	return isValid
}
checkAndDisplayPhotos(false, true)

function convertBytesToMb(bytes) {
	return bytes / 1024 / 1024
}

function getFileHash(file) {
	if (!(file instanceof File)) throw "Not a File Object"
	let encodedString = `${file.name}:${file.size}:${file.lastModified}`
	return btoa(unescape(encodeURIComponent(encodedString)))
}

function packFileList(array) {
	const dt = new DataTransfer()
	array.forEach(file => {
		if (file instanceof File) dt.items.add(file)
	})
	newFileList = dt.files
	return newFileList
}

$(document).on('change', '.input-files', checkAndDisplayPhotos)

$(".add-form-section-btn").on('click', function () {
	const $olSection = $('.ol-details-section'),
	      $olSubSection =  $('.ol-details-subsection'),
	      newSectionId = $olSubSection.last().data("form-section-id") + 1,
	      digitsToReplace = /(\d+)(\])$/,
	      $olDetailsSection = $('.ol-details-subsection:last')
	          .clone()
	          .attr('data-form-section-id', newSectionId)
	          .addClass('new-section-loading'),
	      $invalidPhotoUpload = $olDetailsSection.find('.invalid-photo-upload'),
	      $invalidMaxPhotos = $olDetailsSection.find('.invalid-max-files')

	if ($olSubSection.length >= MAX_SECTIONS_NUMBER) return

	$olSection.append($olDetailsSection)

	if ($('.ol-details-subsection').length >= MAX_SECTIONS_NUMBER) $(this).addClass('d-none')

	$olDetailsSection.find('label').each(function() {
		$(this).attr('for', $(this).attr('for').replace(digitsToReplace, newSectionId+'$2'))
	})

	$olDetailsSection.find(".images-list").each(function() {
		$(this).empty()
	})

	$olDetailsSection.find(".input-values").val("").each(function() {
		this.name = this.name.replace(digitsToReplace, newSectionId+'$2')
		this.id= this.id.replace(digitsToReplace, newSectionId+'$2')
	})

	if (!$invalidPhotoUpload[0].classList.contains('d-none')) $invalidPhotoUpload.addClass('d-none')

	if (!$invalidMaxPhotos[0].classList.contains('d-none')) $invalidMaxPhotos.addClass('d-none')

	$olDetailsSection.removeClass('new-section-loading')
})

$(document).on('click','.image-delete-btn', function() {
	let $inputFiles = $(this).closest('.add-keys-image').find('.input-files').eq(0),
	    $inputFilesArray = Array.from($inputFiles[0].files)
	const $clickedDeleteBtn = $(this)[0],
	      fileToDeleteHash = $clickedDeleteBtn.getAttribute('data-file-hash')

	$inputFilesArray = $inputFilesArray.filter(function(file) {
		return getFileHash(file) !== fileToDeleteHash
	})

	$inputFiles[0].files = packFileList($inputFilesArray)
	$inputFiles.trigger('change')
})

$(document).on('click','.section-delete-btn', function() {
	const $olDetailsSection = $('.ol-details-subsection'),
	      $olSubSection = $(this).closest($olDetailsSection),
	      $inputFiles = $olSubSection.find('.input-values'),
	      $inputFilesArray = Array.from($inputFiles),
	      $addSectionBtn =  $(".add-form-section-btn"),
	      isInputValues = $inputFilesArray.some(input => {return input.value.trim() !== ''})

	if ($olDetailsSection.length === 1) return

	if (!isInputValues || confirm("Вы точно хотите удалить данную секцию?")) $olSubSection.remove()

	if ($('.ol-details-subsection').length < MAX_SECTIONS_NUMBER) $addSectionBtn.removeClass('d-none')
})

$form.on('submit', async function(event) {
	$(this).addClass('form-loading')
	event.preventDefault()
	event.stopPropagation()

	if (
		!$(this)[0].checkValidity() ||
		!(await checkAndDisplayPhotos(false, true))
	) {
		$(this).removeClass('form-loading').addClass('was-validated')
		return
	}

	const url = $(this).attr('action'),
	      type = $(this).attr('method'),
	      formData = new FormData(),
	      dataArray = $(this).serializeArray(),
	      successMessage = $('.success-message')

	$.each(dataArray,function(i, val) {
		formData.append(val.name, val.value)
	})

	$.ajax({
		url: url,
		type: type,
		data: formData,
		dataType: "json",
		processData: false,
		success: function(response) {
			if (response.status === 'success') {
				$(this).remove()
				successMessage.removeClass('d-none')
			}
		},
		error: function(response) {
			$form.removeClass('form-loading')
		}
	})
	return false
})