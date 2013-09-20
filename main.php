<?php
	$con=mysqli_connect("smartmobisyscom.fatcowmysql.com","fyp2013gary","!cityu2013","fyp2013gary");

	// Check connection
	if (mysqli_connect_errno($con)) {
		echo "Failed to connect to MySQL: " . mysqli_connect_error() . "\n";
	} 
	
	//UploadStu: Delete Student data in Server
	if ($_REQUEST["requestType"] == "delStu") {
		$result_del = mysqli_query($con, "DELETE FROM Student");
		if (!$result_del) {
			echo "Synchronize - Fail";
		}		
	//UploadStu: Upload Student data to Server
	} else if ($_REQUEST["requestType"] == "uploadStu") {
		$result_uploadALL = true;
		for ($i=0; $i<$_REQUEST["rowCount"]; $i++) {
			$command="INSERT INTO Student (Birthdate, DepartmentID, Email, Name, Phone, StudentID) VALUES ('" 
			. $_REQUEST["Birthdate" . $i] . "', '" . $_REQUEST["DepartmentID" . $i] . "', '" . $_REQUEST["Email" . $i] 
			. "', '" . $_REQUEST["Name" . $i] . "', " . $_REQUEST["Phone" . $i] . ", " . $_REQUEST["StudentID" . $i] . ")";

			$result_upload = mysqli_query($con,$command);
			if (!$result_upload) {
				$result_uploadALL = false;
			}
		}
		if ($result_uploadALL) {
			echo "Synchronize - Success";
		} else {
			echo "Synchronize - Fail";
		}
	//DownloadStu: Download Student data from Server	
	} else if ($_REQUEST["requestType"] == "downloadStu") {
		$result_download = mysqli_query($con, "SELECT * FROM Student");
	
		while($row = mysqli_fetch_array($result_download)) {
			echo '{';
			echo 'Birthdate:"' . $row['Birthdate'] . '",';
			echo 'DepartmentID:"' . $row['DepartmentID'] . '",';
			echo 'Email:"' . $row['Email'] . '",';
			echo 'Name:"' . $row['Name'] . '",';
			echo 'Phone:' . $row['Phone'] . ',';
			echo 'StudentID:' . $row['StudentID'] . '}|';
		}
	//UploadCourse: Delete Course data in Server
	} else if ($_REQUEST["requestType"] == "delCourse") {
		$result_del = mysqli_query($con, "DELETE FROM Course");
		if (!$result_del) {
			echo "Synchronize - Fail";
		}
	//UploadCourse: Upload Course data to Server
	} else if ($_REQUEST["requestType"] == "uploadCourse") {
		$result_uploadALL = true;
		for ($i=0; $i<$_REQUEST["rowCount"]; $i++) {	
			$command="INSERT INTO Course (CourseID, DepartmentID, Name) VALUES ('" 
			. $_REQUEST["CourseID" . $i] . "', '" . $_REQUEST["DepartmentID" . $i] . "', '" . $_REQUEST["Name" . $i] . "')";
		
			$result_upload = mysqli_query($con,$command);
			if (!$result_upload) {
				$result_uploadALL = false;
			}
		}
		if ($result_uploadALL) {
			echo "Synchronize - Success";
		} else {
			echo "Synchronize - Fail";
		}
	//DownloadCourse: Download Course data from Server		
	} else if ($_REQUEST["requestType"] == "downloadCourse") {
		$result_download = mysqli_query($con, "SELECT * FROM Course");
	
		while($row = mysqli_fetch_array($result_download)) {
			echo '{';
			echo 'CourseID:"' . $row['CourseID'] . '",';
			echo 'DepartmentID:"' . $row['DepartmentID'] . '",';
			echo 'Name:"' . $row['Name'] . '"}|';
		}
	//UploadDepart: Delete Department data in Server	
	} else if ($_REQUEST["requestType"] == "delDepart") {
		$result_del = mysqli_query($con, "DELETE FROM Department");
		if (!$result_del) {
			echo "Synchronize - Fail";
		}
	//UploadDepart: Upload Department data to Server	
	} else if ($_REQUEST["requestType"] == "uploadDepart") {
		$result_uploadALL = true;
		for ($i=0; $i<$_REQUEST["rowCount"]; $i++) {	
			$command="INSERT INTO Department (DepartmentID, Email, Name, Phone) VALUES ('" 
			. $_REQUEST["DepartmentID" . $i] . "', '" . $_REQUEST["Email" . $i] . "', '" . $_REQUEST["Name" . $i] 
			. "', " . $_REQUEST["Phone" . $i] . ")";
		
			$result_upload = mysqli_query($con,$command);
			if (!$result_upload) {
				$result_uploadALL = false;
			}
		}
		if ($result_uploadALL) {
			echo "Synchronize - Success";
		} else {
			echo "Synchronize - Fail";
		}
	//DownloadDepart: Download Department data from Server
	} else if ($_REQUEST["requestType"] == "downloadDepart") {
		$result_download = mysqli_query($con, "SELECT * FROM Department");
	
		while($row = mysqli_fetch_array($result_download)) {
			echo '{';
			echo 'DepartmentID:"' . $row['DepartmentID'] . '",';
			echo 'Email:"' . $row['Email'] . '",';
			echo 'Name:"' . $row['Name'] . '",';
			echo 'Phone:' . $row['Phone'] . '}|';
		}
	//UploadEnroll: Delete Enrollment data in Server	
	} else if ($_REQUEST["requestType"] == "delEnroll") {
		$result_del = mysqli_query($con, "DELETE FROM Enrollment");
		if (!$result_del) {
			echo "Synchronize - Fail";
		}
	//UploadEnroll: Upload Enrollment data to Server	
	} else if ($_REQUEST["requestType"] == "uploadEnroll") {
		$result_uploadALL = true;
		for ($i=0; $i<$_REQUEST["rowCount"]; $i++) {	
			$command="INSERT INTO Enrollment (CourseID, Grade, SidCidT, StudentID, Term) VALUES ('" 
			. $_REQUEST["CourseID" . $i] . "', '" . $_REQUEST["Grade" . $i] . "', '" . $_REQUEST["SidCidT" . $i] 
			. "', " . $_REQUEST["StudentID" . $i] . ", '" . $_REQUEST["Term" . $i] . "')";
		
			$result_upload = mysqli_query($con,$command);
			if (!$result_upload) {
				$result_uploadALL = false;
			}
		}
		if ($result_uploadALL) {
			echo "Synchronize - Success";
		} else {
			echo "Synchronize - Fail";
		}
	//DownloadEnroll: Download Enrollment data from Server
	} else if ($_REQUEST["requestType"] == "downloadEnroll") {
		$result_download = mysqli_query($con, "SELECT * FROM Enrollment");
	
		while($row = mysqli_fetch_array($result_download)) {
			echo '{';
			echo 'CourseID:"' . $row['CourseID'] . '",';
			echo 'Grade:"' . $row['Grade'] . '",';
			echo 'SidCidT:"' . $row['SidCidT'] . '",';
			echo 'StudentID:' . $row['StudentID'] . ',';
			echo 'Term:"' . $row['Term'] . '"}|';
		}
	//Wrong Request Type
	} else {
		echo "Wrong request type" . "\n";
	}
	mysqli_close($con);
?>