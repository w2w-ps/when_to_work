package com.wavemaker.when_to_work.updateEmployeePwd.service;


import com.wavemaker.when_to_work.updateEmployeePwd.model.*;
import com.wavemaker.when_to_work.updateEmployeePwd.model.RootRequest;
import com.wavemaker.when_to_work.updateEmployeePwd.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface UpdateEmployeePwdService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
   * @return RootResponse
   */
  @RequestLine("POST /login/update-password")
  @Headers({
    "Content-Type: application/json",
    "Accept: application/json",  })
  RootResponse invoke(RootRequest body);

}
